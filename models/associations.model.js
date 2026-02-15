const { User } = require("./user.model");
const { RefreshToken } = require("./refreshToken.model");
const { Obituary } = require("./obituary.model");
const { Event } = require("./event.model");
const { Photo } = require("./photo.model");
const { Keeper } = require("./keeper.model");
const { KeeperApplication } = require("./keeper_application.model");
const { SorrowBook } = require("./sorrow_book.model");
const { MemoryLog } = require("./memory_logs.model");
const { Dedication } = require("./dedication.model");
const { Condolence } = require("./condolence.model");
const { Candle } = require("./candle.model");
const { Visit } = require("./visit.model");
const { Cemetry } = require("./cemetry.model");
const { Cemeteries } = require("./cemetery.model");
const { CompanyPage } = require("./company_page.model");
const { FAQ } = require("./faq.model");
const { FloristSlide } = require("./florist_slide.model");
const { FloristShop } = require("./florist_shop.model");
const { KeeperNotification } = require("./keeper_notification");
const { Order } = require("./order.model");
// const { Guardian } = require("./guardian.model");

//  USER ↔ AUTH
User.hasMany(RefreshToken, { foreignKey: "userId" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

//  USER ↔ KEEPER
User.hasMany(Keeper, {
  foreignKey: "userId",
  as: "keepers",
});
Keeper.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

//  OBITUARY ↔ KEEPER
Obituary.hasMany(Keeper, {
  foreignKey: "obituaryId",
  as: "keepers",
});
Keeper.belongsTo(Obituary, {
  foreignKey: "obituaryId",
  as: "obituary",
});

//  USER ↔ KEEPER APPLICATION
User.hasMany(KeeperApplication, {
  foreignKey: "userId",
});
KeeperApplication.belongsTo(User, {
  foreignKey: "userId",
});

//  OBITUARY ↔ KEEPER APPLICATION
Obituary.hasMany(KeeperApplication, {
  foreignKey: "obituaryId",
});
KeeperApplication.belongsTo(Obituary, {
  foreignKey: "obituaryId",
});

Obituary.hasMany(Event, { foreignKey: "obituaryId" });
Event.belongsTo(Obituary, { foreignKey: "obituaryId" });

Obituary.hasMany(Candle, { foreignKey: "obituaryId", as: "candles" });
Candle.belongsTo(Obituary, { foreignKey: "obituaryId", as: "obituary" });

Obituary.hasMany(Visit, { foreignKey: "obituaryId", as: "visits" });
Visit.belongsTo(Obituary, { foreignKey: "obituaryId", as: "obituary" });

User.hasMany(SorrowBook, { foreignKey: "userId" });
SorrowBook.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Cemetry, { foreignKey: "userId" });
Cemetry.belongsTo(User, { foreignKey: "userId" });

CompanyPage.hasMany(Cemetry, { foreignKey: "companyId" });
Cemetry.belongsTo(CompanyPage, { foreignKey: "companyId" });

Cemetry.hasMany(Obituary, { foreignKey: "funeralCemetery" });
Obituary.belongsTo(Cemetry, { foreignKey: "funeralCemetery" });

Cemeteries.hasMany(Obituary, { foreignKey: "funeralCemeteryId" });
Obituary.belongsTo(Cemeteries, {
  foreignKey: "funeralCemeteryId",
  as: "Cemeteries",
});

CompanyPage.hasMany(FloristSlide, { foreignKey: "companyId" });
FloristSlide.belongsTo(CompanyPage, { foreignKey: "companyId" });

CompanyPage.hasMany(FloristShop, { foreignKey: "companyId" });
FloristShop.belongsTo(CompanyPage, { foreignKey: "companyId" });

CompanyPage.hasMany(FAQ, { foreignKey: "companyId" });
FAQ.belongsTo(CompanyPage, { foreignKey: "companyId" });

Obituary.hasMany(Keeper, { foreignKey: "obituaryId" });
Keeper.belongsTo(Obituary, { foreignKey: "obituaryId" });

User.hasOne(CompanyPage, { foreignKey: "userId" });
CompanyPage.belongsTo(User, { foreignKey: "userId" });

Obituary.hasMany(Photo, { foreignKey: "obituaryId" });
Photo.belongsTo(Obituary, { foreignKey: "obituaryId" });

Obituary.hasMany(Condolence, { foreignKey: "obituaryId" });
Condolence.belongsTo(Obituary, { foreignKey: "obituaryId" });

Obituary.hasMany(Dedication, { foreignKey: "obituaryId" });
Dedication.belongsTo(Obituary, { foreignKey: "obituaryId" });

Obituary.hasMany(SorrowBook, { foreignKey: "obituaryId" });
SorrowBook.belongsTo(Obituary, { foreignKey: "obituaryId" });

Obituary.hasMany(MemoryLog, { foreignKey: "obituaryId" });
MemoryLog.belongsTo(Obituary, { foreignKey: "obituaryId" });

User.hasMany(MemoryLog, { foreignKey: "userId" });
MemoryLog.belongsTo(User, { foreignKey: "userId" });

// Obituary.hasMany(Event, { foreignKey: "obituaryId" });  for future
// Event.belongsTo(Obituary, { foreignKey: "obituaryId" });

User.hasMany(Obituary, { foreignKey: "userId" });
Obituary.belongsTo(User, { foreignKey: "userId" });

User.hasMany(KeeperNotification, {
  foreignKey: "sender",
  as: "SentNotifications",
});
KeeperNotification.belongsTo(User, { foreignKey: "sender", as: "Sender" });

User.hasMany(KeeperNotification, {
  foreignKey: "receiver",
  as: "ReceivedNotifications",
});
KeeperNotification.belongsTo(User, { foreignKey: "receiver", as: "Receiver" });

KeeperNotification.belongsTo(Obituary, {
  foreignKey: "obituaryId",
  as: "Obituary",
});
Obituary.hasMany(KeeperNotification, {
  foreignKey: "obituaryId",
  as: "Notifications",
});

// Order associations
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// User.hasMany(Guardian, { foreignKey: "userId" });
// Guardian.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  User,
  RefreshToken,
  Obituary,
  Event,
  Photo,
  MemoryLog,
  Keeper,
  KeeperApplication,
  SorrowBook,
  Dedication,
  Condolence,
  Order,
  // Guardian,
};
