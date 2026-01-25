const { User } = require("./user.model");
const { RefreshToken } = require("./refreshToken.model");
const { Obituary } = require("./obituary.model");
const { Event } = require("./event.model");
const { Photo } = require("./photo.model");
const { Keeper } = require("./keeper.model");
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

/* ===========================
   USER ↔ AUTH
=========================== */
User.hasMany(RefreshToken, { foreignKey: "userId" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

/* ===========================
   USER ↔ KEEPER
=========================== */
User.hasMany(Keeper, {
  foreignKey: "userId",
  as: "keepers",
});
Keeper.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/* ===========================
   OBITUARY ↔ KEEPER
=========================== */
Obituary.hasMany(Keeper, {
  foreignKey: "obituaryId",
  as: "keepers",
});
Keeper.belongsTo(Obituary, {
  foreignKey: "obituaryId",
  as: "obituary",
});

/* ===========================
   OBITUARY ↔ EVENTS / VISITS
=========================== */
Obituary.hasMany(Event, { foreignKey: "obituaryId" });
Event.belongsTo(Obituary, { foreignKey: "obituaryId" });

Obituary.hasMany(Visit, { foreignKey: "obituaryId", as: "visits" });
Visit.belongsTo(Obituary, { foreignKey: "obituaryId", as: "obituary" });

/* ===========================
   OBITUARY ↔ CANDLES
=========================== */
Obituary.hasMany(Candle, { foreignKey: "obituaryId", as: "candles" });
Candle.belongsTo(Obituary, { foreignKey: "obituaryId", as: "obituary" });

/* ===========================
   OBITUARY ↔ MEDIA / CONTENT
=========================== */
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

/* ===========================
   USER ↔ MEMORY LOGS
=========================== */
User.hasMany(MemoryLog, { foreignKey: "userId" });
MemoryLog.belongsTo(User, { foreignKey: "userId" });

/* ===========================
   USER ↔ OBITUARY
=========================== */
User.hasMany(Obituary, { foreignKey: "userId" });
Obituary.belongsTo(User, { foreignKey: "userId" });

/* ===========================
   USER ↔ SORROW BOOK
=========================== */
User.hasMany(SorrowBook, { foreignKey: "userId" });
SorrowBook.belongsTo(User, { foreignKey: "userId" });

/* ===========================
   USER ↔ CEMETRY / COMPANY
=========================== */
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

/* ===========================
   COMPANY ↔ CONTENT
=========================== */
User.hasOne(CompanyPage, { foreignKey: "userId" });
CompanyPage.belongsTo(User, { foreignKey: "userId" });

CompanyPage.hasMany(FloristSlide, { foreignKey: "companyId" });
FloristSlide.belongsTo(CompanyPage, { foreignKey: "companyId" });

CompanyPage.hasMany(FloristShop, { foreignKey: "companyId" });
FloristShop.belongsTo(CompanyPage, { foreignKey: "companyId" });

CompanyPage.hasMany(FAQ, { foreignKey: "companyId" });
FAQ.belongsTo(CompanyPage, { foreignKey: "companyId" });

/* ===========================
   KEEPER NOTIFICATIONS
=========================== */
User.hasMany(KeeperNotification, {
  foreignKey: "sender",
  as: "SentNotifications",
});
KeeperNotification.belongsTo(User, {
  foreignKey: "sender",
  as: "Sender",
});

User.hasMany(KeeperNotification, {
  foreignKey: "receiver",
  as: "ReceivedNotifications",
});
KeeperNotification.belongsTo(User, {
  foreignKey: "receiver",
  as: "Receiver",
});

Obituary.hasMany(KeeperNotification, {
  foreignKey: "obituaryId",
  as: "Notifications",
});
KeeperNotification.belongsTo(Obituary, {
  foreignKey: "obituaryId",
  as: "Obituary",
});

/* ===========================
   ORDERS
=========================== */
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

/* ===========================
   EXPORTS
=========================== */
module.exports = {
  User,
  RefreshToken,
  Obituary,
  Event,
  Photo,
  MemoryLog,
  Keeper,
  SorrowBook,
  Dedication,
  Condolence,
  Order,
  KeeperNotification,
};
