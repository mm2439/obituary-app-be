const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // null for advertisers who aren't logged in users
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "RESTRICT",
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true, // set after first payment
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeCheckoutSessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true, // set for subscription-based orders
    },
    packageType: {
      type: DataTypes.ENUM(
        'memory_page_one_month',
        'memory_page_one_year', 
        'memory_page_six_years',
        'florist_monthly_small_city',
        'florist_monthly_large_city',
        'florist_monthly_capital_city',
        'florist_yearly_small_city',
        'florist_yearly_large_city',
        'florist_yearly_capital_city',
        'advertiser_monthly_small_city',
        'advertiser_monthly_large_city',
        'advertiser_monthly_capital_city',
        'advertiser_yearly_small_city',
        'advertiser_yearly_large_city',
        'advertiser_yearly_capital_city'
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'canceled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true, // stores slug, email, city, page etc.
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: true,
  }
);

const validateOrder = (order) => {
  const orderSchema = Joi.object({
    userId: Joi.number().integer().optional().allow(null),
    packageType: Joi.string().valid(
      'memory_page_one_month',
      'memory_page_one_year', 
      'memory_page_six_years',
      'florist_monthly_small_city',
      'florist_monthly_large_city',
      'florist_monthly_capital_city',
      'florist_yearly_small_city',
      'florist_yearly_large_city',
      'florist_yearly_capital_city',
      'advertiser_monthly_small_city',
      'advertiser_monthly_large_city',
      'advertiser_monthly_capital_city',
      'advertiser_yearly_small_city',
      'advertiser_yearly_large_city',
      'advertiser_yearly_capital_city'
    ).required(),
    metadata: Joi.object().optional(),
    amount: Joi.number().positive().required(),
  });

  return orderSchema.validate(order);
};

module.exports = { Order, validateOrder };