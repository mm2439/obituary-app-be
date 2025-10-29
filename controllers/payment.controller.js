const { StatusCodes } = require("http-status-codes");
const { stripe, PACKAGE_CONFIG } = require("../config/stripe");
const { Order, validateOrder } = require("../models/order.model");
const { User } = require("../models/user.model");
const { Obituary } = require("../models/obituary.model");
const { Keeper } = require("../models/keeper.model");

// Create payment for different types of customers (middleware makes auth optional)
const createPayment = async (req, res) => {
  const requestId = `REQ-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    const { packageType, metadata } = req.body;

    console.log(
      `[${requestId}] Payment creation initiated: ${packageType}, User: ${
        req.user?.id || "anonymous"
      }`
    );

    // Validate package exists
    if (!PACKAGE_CONFIG[packageType]) {
      console.log(`[${requestId}] Invalid package type: ${packageType}`);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Neveljaven paket",
      });
    }

    const package_info = PACKAGE_CONFIG[packageType];
    let userId = req.user?.id || null;
    let customerData = {};

    // Handle different customer types
    if (packageType.startsWith("memory_page_")) {
      // Memory page payment - requires logged in user
      if (!req.user) {
        console.log(
          `[${requestId}] Unauthorized: User not logged in for memory page`
        );
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Potrebna je prijava",
        });
      }

      userId = req.user.id;
      customerData = {
        email: req.user.email,
        name: req.user.name,
      };

      // Validate slug exists
      if (!metadata.slug) {
        console.log(`[${requestId}] Missing slug for memory page`);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Manjka podatek o spominski strani",
        });
      }
    } else if (packageType.startsWith("florist_")) {
      // Florist payment - requires logged in florist user
      if (!req.user) {
        console.log(
          `[${requestId}] Unauthorized: User not logged in for florist`
        );
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Potrebna je prijava",
        });
      }

      userId = req.user.id;

      if (req.user.role !== "Florist") {
        console.log(
          `[${requestId}] Access denied: User ${req.user.id} is not a florist (role: ${req.user.role})`
        );
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Dostop je dovoljen samo cvetličarnam",
        });
      }

      customerData = {
        email: req.user.email,
        name: req.user.name,
      };
    } else if (packageType.startsWith("advertiser_")) {
      // Advertiser payment - no login required
      if (!metadata.email || !metadata.city || !metadata.page) {
        console.log(`[${requestId}] Missing advertiser data`);
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Manjkajo podatki za oglaševanje",
        });
      }

      customerData = {
        email: metadata.email,
        name: metadata.name || "Oglaševalec",
      };
    }

    // Create order in database
    const orderData = {
      userId,
      packageType,
      metadata: {
        ...metadata,
        userEmail: customerData.email,
        userName: customerData.name,
      },
      amount: package_info.amount / 100, // Already in cents for Stripe
    };

    const { error } = validateOrder(orderData);
    if (error) {
      console.log(
        `[${requestId}] Order validation failed: ${error.details[0].message}`
      );
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const order = await Order.create(orderData);
    console.log(`[${requestId}] Order created: ${order.id}`);

    // Handle subscription vs one-time payment with Stripe
    let stripeCustomer = null;

    const existingOrder = await Order.findOne({
      where: {
        userId,
        stripeCustomerId: { [require("sequelize").Op.not]: null },
      },
    });

    if (existingOrder && existingOrder.stripeCustomerId) {
      console.log(
        `[${requestId}] Using existing Stripe customer: ${existingOrder.stripeCustomerId}`
      );
      stripeCustomer = await stripe.customers.retrieve(
        existingOrder.stripeCustomerId
      );
    } else {
      stripeCustomer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          userId: userId?.toString() || null,
        },
      });

      console.log(
        `[${requestId}] Stripe customer created: ${stripeCustomer.id}`
      );
      await order.update({ stripeCustomerId: stripeCustomer.id });
    }

    // Create Stripe Checkout Session
    const sessionData = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: package_info.description,
            },
            unit_amount: package_info.amount,
            ...(package_info.type === "subscription" && {
              recurring: {
                interval: package_info.interval,
                interval_count: package_info.interval_count,
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: package_info.type === "subscription" ? "subscription" : "payment",
      success_url: `${process.env.FRONTEND_URL}/payment/return?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/return?orderId=${order.id}&canceled=true`,
      metadata: {
        orderId: order.id.toString(),
        packageType,
        userId: userId?.toString() || null,
      },
      locale: "sl",
      allow_promotion_codes: true,
      phone_number_collection: { enabled: true },
      billing_address_collection: "required",
      custom_fields: [
        {
          key: "tax_id",
          label: {
            type: "custom",
            custom: "Davčna številka (Tax ID)",
          },
          type: "text",
          optional: false,
        },
      ],
    };

    if (stripeCustomer) {
      sessionData.customer = stripeCustomer.id;
    } else {
      sessionData.customer_email = customerData.email;
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    console.log(
      `[${requestId}] Stripe checkout session created: ${session.id}`
    );

    await order.update({ stripeCheckoutSessionId: session.id });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        orderId: order.id,
        paymentUrl: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Payment creation error:`, error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Napaka pri ustvarjanju plačila",
    });
  }
};

// Webhook handler for payment status updates
const handleWebhook = async (req, res) => {
  const webhookId = `WH-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`[${webhookId}] Webhook verified: ${event.type}`);
  } catch (err) {
    console.error(
      `[${webhookId}] Webhook signature verification failed:`,
      err.message
    );
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send(`Webhook Error: ${err.message}`);
  }

  try {
    let order = null;
    let newStatus = null;

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log(`[${webhookId}] Checkout session completed: ${session.id}`);

        order = await Order.findOne({
          where: { stripeCheckoutSessionId: session.id },
        });

        if (!order) {
          console.error(
            `[${webhookId}] Order not found for session ${session.id}`
          );
          return res.status(StatusCodes.NOT_FOUND).send("Order not found");
        }

        // Update with payment intent ID and subscription ID (if applicable)
        const updateData = {};
        if (session.payment_intent) {
          updateData.stripePaymentIntentId = session.payment_intent;
        }
        if (session.subscription) {
          updateData.stripeSubscriptionId = session.subscription;
          console.log(
            `[${webhookId}] Subscription created: ${session.subscription}`
          );
        }
        
        if (Object.keys(updateData).length > 0) {
          await order.update(updateData);
        }

        if (session.payment_status === "paid") {
          newStatus = "paid";
          await handleSuccessfulPayment(order, session);
        }
        break;

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log(
          `[${webhookId}] Payment intent succeeded: ${paymentIntent.id}`
        );

        order = await Order.findOne({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (order && order.status !== "paid") {
          newStatus = "paid";
          await handleSuccessfulPayment(order, paymentIntent);
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log(
          `[${webhookId}] Payment intent failed: ${failedPayment.id}`
        );

        order = await Order.findOne({
          where: { stripePaymentIntentId: failedPayment.id },
        });

        if (order) {
          newStatus = "canceled";
        }
        break;

      case "invoice.payment_succeeded":
        // Handle subscription renewals
        const invoice = event.data.object;
        console.log(`[${webhookId}] Invoice payment succeeded: ${invoice.id}`);

        const customer = await stripe.customers.retrieve(invoice.customer);
        order = await Order.findOne({
          where: { stripeCustomerId: customer.id },
        });

        if (order && order.packageType.startsWith("florist_")) {
          console.log(
            `[${webhookId}] Subscription renewal for florist order ${order.id}`
          );
          // Handle subscription renewal logic here if needed
        }
        break;

      case "customer.subscription.deleted":
        // Handle subscription cancellation
        const canceledSubscription = event.data.object;
        console.log(
          `[${webhookId}] Subscription canceled: ${canceledSubscription.id}`
        );

        order = await Order.findOne({
          where: { stripeSubscriptionId: canceledSubscription.id },
        });

        if (!order) {
          // Try to find by customer ID
          order = await Order.findOne({
            where: { stripeCustomerId: canceledSubscription.customer },
            order: [['createdAt', 'DESC']]
          });
        }

        if (order) {
          newStatus = "canceled";
          console.log(
            `[${webhookId}] Marking order ${order.id} as canceled due to subscription cancellation`
          );
        }
        break;

      case "customer.subscription.updated":
        // Handle subscription updates (e.g., canceled but still active until period end)
        const updatedSubscription = event.data.object;
        
        if (updatedSubscription.cancel_at_period_end) {
          console.log(
            `[${webhookId}] Subscription ${updatedSubscription.id} set to cancel at period end`
          );
          
          order = await Order.findOne({
            where: { stripeSubscriptionId: updatedSubscription.id },
          });

          if (!order) {
            order = await Order.findOne({
              where: { stripeCustomerId: updatedSubscription.customer },
              order: [['createdAt', 'DESC']]
            });
          }

          if (order) {
            // Optionally update to a different status like 'pending_cancellation'
            // For now, we'll keep it as is until actually canceled
            console.log(
              `[${webhookId}] Order ${order.id} subscription will cancel at period end`
            );
          }
        }
        break;

      default:
        console.log(`[${webhookId}] Unhandled event type: ${event.type}`);
        return res.status(StatusCodes.OK).send("OK");
    }

    if (order && newStatus) {
      await order.update({ status: newStatus });
      console.log(`[${webhookId}] Order ${order.id} updated to: ${newStatus}`);
    }

    res.status(StatusCodes.OK).send("OK");
  } catch (error) {
    console.error(`[${webhookId}] Webhook processing error:`, error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Error processing webhook");
  }
};

// Handle successful payment logic
const handleSuccessfulPayment = async (order, payment) => {
  try {
    console.log(
      `Processing successful payment for order ${order.id} (${order.packageType})`
    );

    if (order.packageType.startsWith("memory_page_")) {
      const { slug } = order.metadata;
      const obituary = await Obituary.findOne({ where: { slugKey: slug } });

      if (obituary) {
        const keeper = await Keeper.findOne({
          where: {
            userId: order.userId,
            obituaryId: obituary.id,
          },
        });

        if (keeper) {
          const package_info = PACKAGE_CONFIG[order.packageType];
          const currentExpiry = new Date(keeper.expiry);
          const newExpiry = new Date(currentExpiry);
          newExpiry.setMonth(newExpiry.getMonth() + package_info.duration);

          await keeper.update({ expiry: newExpiry });
          console.log(
            `Keeper ${keeper.id} expiry extended to ${newExpiry.toISOString()}`
          );
        } else {
          console.log(
            `Keeper not found for user ${order.userId} and obituary ${obituary.id}`
          );
        }
      } else {
        console.log(`Obituary not found with slug: ${slug}`);
      }
    }
  } catch (error) {
    console.error(
      `Error handling successful payment for order ${order.id}:`,
      error.message
    );
  }
};

// Get customer portal URL for logged in users (incomplete: I am using the Stripe "no-code" solution instead)
const getCustomerPortal = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Potrebna je prijava",
      });
    }

    const order = await Order.findOne({
      where: {
        userId: req.user.id,
        stripeCustomerId: { [require("sequelize").Op.not]: null },
      },
    });

    if (!order || !order.stripeCustomerId) {
      console.log(`No payments found for user ${req.user.id}`);
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Ni najdenih plačil",
      });
    }

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: order.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}`,
      locale: "sl",
    });

    console.log(`Customer portal accessed by user ${req.user.id}`);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        portalUrl: portalSession.url,
        customerId: order.stripeCustomerId,
      },
    });
  } catch (error) {
    console.error(
      `Customer portal error for user ${req.user?.id}:`,
      error.message
    );
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Napaka pri dostopu do portala",
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Naročilo ni najdeno",
      });
    }

    // Get latest status from Stripe if checkout session exists
    if (order.stripeCheckoutSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          order.stripeCheckoutSessionId
        );

        // Update local status if different
        let newStatus = order.status;

        if (session.payment_status === "paid" && order.status !== "paid") {
          newStatus = "paid";

          // Update payment intent ID if not already set
          if (session.payment_intent && !order.stripePaymentIntentId) {
            await order.update({
              stripePaymentIntentId: session.payment_intent,
            });
          }

          await handleSuccessfulPayment(order, session);
        } else if (
          session.payment_status === "unpaid" &&
          session.status === "expired"
        ) {
          newStatus = "canceled";
        }

        if (newStatus !== order.status) {
          console.log(
            `Order ${orderId} status updated: ${order.status} -> ${newStatus}`
          );
          await order.update({ status: newStatus });
        }
      } catch (stripeError) {
        console.error(
          `Error fetching session ${order.stripeCheckoutSessionId} from Stripe:`,
          stripeError.message
        );
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        packageType: order.packageType,
        amount: order.amount / 100, // Convert back from cents to euros for display
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error(`Get payment status error:`, error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Napaka pri preverjanju statusa plačila",
    });
  }
};

module.exports = {
  createPayment,
  handleWebhook,
  getCustomerPortal,
  getPaymentStatus,
};
