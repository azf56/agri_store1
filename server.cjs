var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express8 = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_multer2 = __toESM(require("multer"), 1);
var import_vite = require("vite");
var import_dotenv3 = __toESM(require("dotenv"), 1);

// server/config/env.ts
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var NODE_ENV = process.env.NODE_ENV || "development";
var IS_PRODUCTION = NODE_ENV === "production";
if (IS_PRODUCTION && (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "")) {
  console.error("\n\u274C ==============================================================");
  console.error("\u274C [FATAL SECURITY ERROR] JWT_SECRET is NOT defined in production!");
  console.error("\u274C Set JWT_SECRET in your cPanel environment variables or .env file.");
  console.error("\u274C Server startup aborted to prevent insecure token generation.");
  console.error("\u274C ==============================================================\n");
  process.exit(1);
}
var JWT_SECRET = process.env.JWT_SECRET || "agri_dev_secret_key_only_for_local_debugging_not_production_2026";
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
var ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : [];
var devError = (err) => {
  if (!IS_PRODUCTION && err) {
    return { error: err?.message || String(err) };
  }
  return {};
};

// server/middleware/security.ts
var helmetInstance = null;
var helmetAttempted = false;
function getHelmetInstance() {
  if (helmetAttempted) return helmetInstance;
  helmetAttempted = true;
  try {
    const reqFn = typeof require === "function" ? require : null;
    if (reqFn) {
      const helmetModule = reqFn("helmet");
      const helmetFn = helmetModule.default || helmetModule;
      if (typeof helmetFn === "function") {
        helmetInstance = helmetFn({
          contentSecurityPolicy: false,
          // Preserves Vite SPA scripts, CSS, and HMR
          crossOriginEmbedderPolicy: false,
          crossOriginResourcePolicy: { policy: "cross-origin" },
          // Allows uploaded images & MSDS docs
          frameguard: false
          // Permits rendering in iframe preview
        });
      }
    }
  } catch {
    console.warn(
      '\u26A0\uFE0F [Security Warning] Package "helmet" is not installed in production node_modules.\n   Using native security headers fallback. Run "npm install" on your server to install all dependencies.'
    );
    helmetInstance = null;
  }
  return helmetInstance;
}
var securityHeaders = (req, res, next) => {
  const helmet = getHelmetInstance();
  if (helmet && typeof helmet === "function") {
    return helmet(req, res, next);
  }
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
};

// server/routes/categories.ts
var import_express = require("express");

// server/models/index.ts
var import_sequelize2 = require("sequelize");

// server/config/database.ts
var import_sequelize = require("sequelize");
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
import_dotenv2.default.config();
var isProduction = process.env.NODE_ENV === "production";
var dbHost = process.env.DB_HOST || "localhost";
var dbPort = parseInt(process.env.DB_PORT || "3306", 10);
var dbName = process.env.DB_NAME || "agri_store_db";
var dbUser = process.env.DB_USER || "root";
var dbPassword = process.env.DB_PASSWORD || "";
var isMysqlConfigured = process.env.DB_DIALECT === "mysql" && (process.env.FORCE_MYSQL === "true" || process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1" || isProduction && process.env.DB_PASSWORD !== void 0);
var dbDialect = isMysqlConfigured ? "mysql" : process.env.DB_DIALECT || "sqlite";
var dataDir = import_path.default.join(process.cwd(), "data");
if (!import_fs.default.existsSync(dataDir)) {
  import_fs.default.mkdirSync(dataDir, { recursive: true });
}
var sequelize;
if (dbDialect === "mysql") {
  sequelize = new import_sequelize.Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: "mysql",
    logging: isProduction ? false : (msg) => console.log(`[SQL]: ${msg}`),
    pool: {
      max: 10,
      min: 0,
      acquire: 3e4,
      idle: 1e4
    },
    timezone: "+03:30",
    // Iran Standard Time
    dialectOptions: {
      charset: "utf8mb4",
      dateStrings: true,
      typeCast: true
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci"
    }
  });
} else {
  sequelize = new import_sequelize.Sequelize({
    dialect: "sqlite",
    storage: import_path.default.join(dataDir, "agri_store.sqlite"),
    logging: isProduction ? false : (msg) => console.log(`[SQLite]: ${msg}`),
    define: {
      timestamps: true,
      underscored: true
    }
  });
}
async function testConnection() {
  try {
    await sequelize.authenticate();
    const dialectName = sequelize.getDialect();
    console.log(`\u2705 [Database] Successfully connected to ${dialectName.toUpperCase()} database.`);
    return { success: true, dialect: dialectName, message: `Connected to ${dialectName.toUpperCase()}` };
  } catch (error) {
    console.error(`\u26A0\uFE0F [Database] Connection error on ${dbDialect}:`, error.message);
    return { success: false, dialect: dbDialect, message: error.message };
  }
}

// server/models/index.ts
var Category = class extends import_sequelize2.Model {
};
Category.init(
  {
    id: {
      type: import_sequelize2.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: import_sequelize2.DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: import_sequelize2.DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "categories",
    timestamps: true,
    underscored: true
  }
);
var Product = class extends import_sequelize2.Model {
};
Product.init(
  {
    id: {
      type: import_sequelize2.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: import_sequelize2.DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: import_sequelize2.DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: import_sequelize2.DataTypes.DECIMAL(14, 0),
      // Prices in Iranian Tomans
      allowNull: false,
      validate: {
        min: 0
      },
      get() {
        const rawValue = this.getDataValue("price");
        return rawValue ? Number(rawValue) : 0;
      }
    },
    stock: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    category_id: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    image_url: {
      type: import_sequelize2.DataTypes.STRING(500),
      allowNull: true
    },
    product_type: {
      type: import_sequelize2.DataTypes.ENUM("\u06A9\u0648\u062F", "\u0633\u0645", "\u0628\u0630\u0631"),
      allowNull: false,
      validate: {
        isIn: [["\u06A9\u0648\u062F", "\u0633\u0645", "\u0628\u0630\u0631"]]
      }
    },
    required_permit_number: {
      type: import_sequelize2.DataTypes.STRING(100),
      allowNull: true,
      comment: "\u0634\u0645\u0627\u0631\u0647 \u0645\u062C\u0648\u0632 \u0633\u0627\u0632\u0645\u0627\u0646 \u062D\u0641\u0638 \u0646\u0628\u0627\u062A\u0627\u062A \u06CC\u0627 \u0645\u0648\u0633\u0633\u0647 \u062A\u062D\u0642\u06CC\u0642\u0627\u062A \u062E\u0627\u06A9 \u0648 \u0622\u0628"
    },
    msds_file_url: {
      type: import_sequelize2.DataTypes.STRING(500),
      allowNull: true,
      comment: "\u0622\u062F\u0631\u0633 \u0641\u0627\u06CC\u0644 \u0628\u0631\u06AF\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u06CC\u0645\u0646\u06CC \u0645\u0648\u0627\u062F \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC MSDS"
    },
    brand: {
      type: import_sequelize2.DataTypes.STRING(120),
      allowNull: true
    },
    package_size: {
      type: import_sequelize2.DataTypes.STRING(100),
      allowNull: true
    },
    is_active: {
      type: import_sequelize2.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "\u0648\u0636\u0639\u06CC\u062A \u0641\u0639\u0627\u0644/\u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0628\u0648\u062F\u0646 \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u06A9\u0627\u062A\u0627\u0644\u0648\u06AF"
    }
  },
  {
    sequelize,
    tableName: "products",
    timestamps: true,
    underscored: true
  }
);
var User = class extends import_sequelize2.Model {
};
User.init(
  {
    id: {
      type: import_sequelize2.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    phone_number: {
      type: import_sequelize2.DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    password_hash: {
      type: import_sequelize2.DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: import_sequelize2.DataTypes.STRING(150),
      allowNull: false
    },
    farm_location: {
      type: import_sequelize2.DataTypes.STRING(255),
      allowNull: true,
      comment: "\u0645\u0648\u0642\u0639\u06CC\u062A \u06CC\u0627 \u0627\u0633\u062A\u0627\u0646/\u0634\u0647\u0631 \u0645\u0632\u0631\u0639\u0647 \u06A9\u0634\u0627\u0648\u0631\u0632"
    },
    role: {
      type: import_sequelize2.DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer"
    }
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true
  }
);
var Order = class extends import_sequelize2.Model {
};
Order.init(
  {
    id: {
      type: import_sequelize2.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    total_price: {
      type: import_sequelize2.DataTypes.DECIMAL(14, 0),
      allowNull: false,
      validate: {
        min: 0
      },
      get() {
        const val = this.getDataValue("total_price");
        return val ? Number(val) : 0;
      }
    },
    status: {
      type: import_sequelize2.DataTypes.ENUM("pending", "confirmed", "processing", "shipped", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending"
    },
    shipping_address: {
      type: import_sequelize2.DataTypes.TEXT,
      allowNull: true
    },
    tracking_code: {
      type: import_sequelize2.DataTypes.STRING(100),
      allowNull: true,
      unique: true
    }
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["tracking_code"]
      }
    ]
  }
);
var OrderItem = class extends import_sequelize2.Model {
};
OrderItem.init(
  {
    id: {
      type: import_sequelize2.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    product_id: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    quantity: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    unit_price: {
      type: import_sequelize2.DataTypes.DECIMAL(14, 0),
      allowNull: false,
      validate: {
        min: 0
      },
      get() {
        const val = this.getDataValue("unit_price");
        return val ? Number(val) : 0;
      }
    }
  },
  {
    sequelize,
    tableName: "order_items",
    timestamps: true,
    underscored: true
  }
);
var Cart = class extends import_sequelize2.Model {
};
Cart.init(
  {
    id: {
      type: import_sequelize2.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    product_id: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    quantity: {
      type: import_sequelize2.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    }
  },
  {
    sequelize,
    tableName: "carts",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"]
      }
    ]
  }
);
Category.hasMany(Product, {
  foreignKey: "category_id",
  as: "products"
});
Product.belongsTo(Category, {
  foreignKey: "category_id",
  as: "category"
});
User.hasMany(Order, {
  foreignKey: "user_id",
  as: "orders"
});
Order.belongsTo(User, {
  foreignKey: "user_id",
  as: "user"
});
Order.hasMany(OrderItem, {
  foreignKey: "order_id",
  as: "items"
});
OrderItem.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order"
});
Product.hasMany(OrderItem, {
  foreignKey: "product_id",
  as: "order_items"
});
OrderItem.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product"
});
User.hasMany(Cart, {
  foreignKey: "user_id",
  as: "cart"
});
User.hasMany(Cart, {
  foreignKey: "user_id",
  as: "cart_items"
});
Cart.belongsTo(User, {
  foreignKey: "user_id",
  as: "user"
});
Product.hasMany(Cart, {
  foreignKey: "product_id",
  as: "cart_entries"
});
Cart.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product"
});

// server/controllers/categoryController.ts
var import_sequelize3 = require("sequelize");
var getAllCategories = async (req, res) => {
  try {
    const { include_products } = req.query;
    if (include_products === "true") {
      const categories2 = await Category.findAll({
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "price", "stock", "product_type", "image_url", "brand"]
          }
        ],
        order: [["id", "ASC"]]
      });
      res.json({
        success: true,
        count: categories2.length,
        data: categories2
      });
      return;
    }
    const categories = await Category.findAll({
      attributes: {
        include: [
          [import_sequelize3.Sequelize.fn("COUNT", import_sequelize3.Sequelize.col("products.id")), "products_count"]
        ]
      },
      include: [
        {
          model: Product,
          as: "products",
          attributes: []
        }
      ],
      group: ["Category.id"],
      order: [["id", "ASC"]]
    });
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC\u200C\u0647\u0627 \u0627\u0632 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
};
var getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Product,
          as: "products",
          attributes: ["id", "name", "price", "stock", "product_type", "image_url", "brand", "required_permit_number"]
        }
      ]
    });
    if (!category) {
      res.status(404).json({
        success: false,
        message: `\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
      });
      return;
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0632 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
};

// server/routes/categories.ts
var router = (0, import_express.Router)();
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
var categories_default = router;

// server/routes/products.ts
var import_express2 = require("express");

// server/controllers/productController.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_sequelize4 = require("sequelize");
function isRequestAdmin(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
    const token = authHeader.split(" ")[1];
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    return decoded && decoded.role === "admin";
  } catch {
    return false;
  }
}
var getAllProducts = async (req, res) => {
  try {
    const {
      category_id,
      product_type,
      search,
      min_price,
      max_price,
      in_stock,
      brand,
      sort,
      include_inactive,
      is_active,
      page = "1",
      limit = "12"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;
    const whereConditions = {};
    const isAdmin = isRequestAdmin(req);
    if (isAdmin && include_inactive === "true") {
      if (is_active !== void 0) {
        whereConditions.is_active = is_active === "true";
      }
    } else {
      whereConditions.is_active = true;
    }
    if (category_id) {
      whereConditions.category_id = Number(category_id);
    }
    if (product_type && ["\u06A9\u0648\u062F", "\u0633\u0645", "\u0628\u0630\u0631"].includes(product_type)) {
      whereConditions.product_type = product_type;
    }
    if (brand) {
      whereConditions.brand = { [import_sequelize4.Op.like]: `%${brand}%` };
    }
    if (in_stock === "true") {
      whereConditions.stock = { [import_sequelize4.Op.gt]: 0 };
    }
    if (min_price || max_price) {
      whereConditions.price = {};
      if (min_price) {
        whereConditions.price[import_sequelize4.Op.gte] = Number(min_price);
      }
      if (max_price) {
        whereConditions.price[import_sequelize4.Op.lte] = Number(max_price);
      }
    }
    if (search) {
      const searchTerm = String(search).trim();
      whereConditions[import_sequelize4.Op.or] = [
        { name: { [import_sequelize4.Op.like]: `%${searchTerm}%` } },
        { description: { [import_sequelize4.Op.like]: `%${searchTerm}%` } },
        { brand: { [import_sequelize4.Op.like]: `%${searchTerm}%` } },
        { required_permit_number: { [import_sequelize4.Op.like]: `%${searchTerm}%` } }
      ];
    }
    let order = [["id", "DESC"]];
    if (sort === "price_asc") {
      order = [["price", "ASC"]];
    } else if (sort === "price_desc") {
      order = [["price", "DESC"]];
    } else if (sort === "newest") {
      order = [["created_at", "DESC"]];
    } else if (sort === "stock") {
      order = [["stock", "DESC"]];
    } else if (sort === "name") {
      order = [["name", "ASC"]];
    }
    const { count, rows } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "description"]
        }
      ],
      order,
      limit: limitNum,
      offset,
      distinct: true
    });
    res.json({
      success: true,
      total_count: count,
      total_pages: Math.ceil(count / limitNum),
      current_page: pageNum,
      limit: limitNum,
      data: rows
    });
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0627\u0632 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "description"]
        }
      ]
    });
    if (!product) {
      res.status(404).json({
        success: false,
        message: `\u0645\u062D\u0635\u0648\u0644\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
      });
      return;
    }
    if (!product.is_active && !isRequestAdmin(req)) {
      res.status(404).json({
        success: false,
        message: `\u0645\u062D\u0635\u0648\u0644\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062A`
      });
      return;
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u062D\u0635\u0648\u0644 \u0627\u0632 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};

// server/controllers/adminController.ts
var import_sequelize5 = require("sequelize");

// server/middleware/upload.ts
var import_multer = __toESM(require("multer"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var productsUploadDir = import_path2.default.join(process.cwd(), "public", "uploads", "products");
var msdsUploadDir = import_path2.default.join(process.cwd(), "public", "uploads", "msds");
[productsUploadDir, msdsUploadDir].forEach((dir) => {
  if (!import_fs2.default.existsSync(dir)) {
    import_fs2.default.mkdirSync(dir, { recursive: true });
  }
});
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "msds_file" || file.mimetype === "application/pdf") {
      cb(null, msdsUploadDir);
    } else {
      cb(null, productsUploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = import_path2.default.extname(file.originalname).toLowerCase();
    const safeBaseName = import_path2.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${file.fieldname}-${safeBaseName}-${uniqueSuffix}${ext}`);
  }
});
var fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedDocTypes = ["application/pdf"];
  if (file.fieldname === "image" || file.fieldname === "image_file") {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("\u0641\u0631\u0645\u062A \u062A\u0635\u0648\u06CC\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0641\u0642\u0637 \u0641\u0631\u0645\u062A\u200C\u0647\u0627\u06CC JPG\u060C PNG \u0648 WebP \u0645\u062C\u0627\u0632 \u0645\u06CC\u200C\u0628\u0627\u0634\u0646\u062F."));
    }
  } else if (file.fieldname === "msds_file") {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("\u0641\u0631\u0645\u062A \u0628\u0631\u06AF\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u06CC\u0645\u0646\u06CC MSDS \u0628\u0627\u06CC\u062F \u0641\u0627\u06CC\u0644 PDF \u0628\u0627\u0634\u062F."));
    }
  } else {
    cb(null, true);
  }
};
var isValidMediaUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/");
};
var checkMagicBytes = (filePath, expectedCategory) => {
  let fd = null;
  try {
    if (!import_fs2.default.existsSync(filePath)) return false;
    fd = import_fs2.default.openSync(filePath, "r");
    const buffer = Buffer.alloc(16);
    const bytesRead = import_fs2.default.readSync(fd, buffer, 0, 16, 0);
    if (bytesRead < 4) return false;
    if (expectedCategory === "pdf") {
      return buffer[0] === 37 && buffer[1] === 80 && buffer[2] === 68 && buffer[3] === 70 && buffer[4] === 45;
    }
    if (expectedCategory === "image") {
      if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
        return true;
      }
      if (buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71 && buffer[4] === 13 && buffer[5] === 10 && buffer[6] === 26 && buffer[7] === 10) {
        return true;
      }
      if (buffer[0] === 82 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 70 && bytesRead >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") {
        return true;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.error(`\u26A0\uFE0F [Upload Security] Failed to read magic bytes for ${filePath}:`, err);
    return false;
  } finally {
    if (fd !== null) {
      try {
        import_fs2.default.closeSync(fd);
      } catch {
      }
    }
  }
};
var buildAbsoluteUploadUrl = (req, relativePath) => {
  if (!relativePath) return "";
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  const cleanPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const baseUrlEnv = process.env.BASE_URL || process.env.APP_URL || process.env.SERVER_URL || (process.env.NODE_ENV === "production" ? "https://api.shop.avinia.ir" : "");
  if (baseUrlEnv) {
    return `${baseUrlEnv.replace(/\/$/, "")}${cleanPath}`;
  }
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host") || "localhost:3000";
  return `${protocol}://${host}${cleanPath}`;
};
var upload = (0, import_multer.default)({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB absolute ceiling for MSDS documents
  }
});
var rawProductUploadMiddleware = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "image_file", maxCount: 1 },
  { name: "msds_file", maxCount: 1 }
]);
var adminProductUpload = (req, res, next) => {
  rawProductUploadMiddleware(req, res, (err) => {
    if (err) {
      return next(err);
    }
    const files = req.files;
    const uploadedFileList = [];
    if (files) {
      Object.values(files).forEach((arr) => {
        if (Array.isArray(arr)) {
          uploadedFileList.push(...arr);
        }
      });
    } else if (req.file) {
      uploadedFileList.push(req.file);
    }
    const unlinkAllFiles = () => {
      uploadedFileList.forEach((file) => {
        try {
          if (file.path && import_fs2.default.existsSync(file.path)) {
            import_fs2.default.unlinkSync(file.path);
          }
        } catch (unlinkErr) {
          console.error(`\u26A0\uFE0F Failed to remove rejected file ${file.path}:`, unlinkErr);
        }
      });
    };
    const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
    const MAX_MSDS_SIZE_BYTES = 10 * 1024 * 1024;
    for (const file of uploadedFileList) {
      const isMsds = file.fieldname === "msds_file" || file.mimetype === "application/pdf";
      if (isMsds) {
        if (file.size > MAX_MSDS_SIZE_BYTES) {
          unlinkAllFiles();
          res.status(413).json({
            success: false,
            message: "\u062D\u062C\u0645 \u0628\u0631\u06AF\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u06CC\u0645\u0646\u06CC (MSDS) \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 (\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F1\u06F0 \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A) \u0627\u0633\u062A."
          });
          return;
        }
        if (!checkMagicBytes(file.path, "pdf")) {
          unlinkAllFiles();
          res.status(400).json({
            success: false,
            message: "\u0645\u062D\u062A\u0648\u0627\u06CC \u0641\u0627\u06CC\u0644 \u0628\u0631\u06AF\u0647 \u0627\u06CC\u0645\u0646\u06CC \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u0627\u0645\u0636\u0627\u06CC \u0641\u0627\u06CC\u0644 \u0628\u0627 \u0641\u0631\u0645\u062A PDF \u0645\u0637\u0627\u0628\u0642\u062A \u0646\u062F\u0627\u0631\u062F."
          });
          return;
        }
      } else {
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          unlinkAllFiles();
          res.status(413).json({
            success: false,
            message: "\u062D\u062C\u0645 \u062A\u0635\u0648\u06CC\u0631 \u0627\u0646\u062A\u062E\u0627\u0628\u06CC \u0628\u06CC\u0634 \u0627\u0632 \u0633\u0642\u0641 \u0645\u062C\u0627\u0632 (\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F5 \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A) \u0627\u0633\u062A."
          });
          return;
        }
        if (!checkMagicBytes(file.path, "image")) {
          unlinkAllFiles();
          res.status(400).json({
            success: false,
            message: "\u0645\u062D\u062A\u0648\u0627\u06CC \u0641\u0627\u06CC\u0644 \u062A\u0635\u0648\u06CC\u0631 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u0627\u0645\u0636\u0627\u06CC \u0641\u0627\u06CC\u0644 \u0628\u0627 \u0641\u0631\u0645\u062A\u200C\u0647\u0627\u06CC \u0645\u062C\u0627\u0632 \u062A\u0635\u0648\u06CC\u0631\u06CC (JPG, PNG, WebP) \u0645\u0637\u0627\u0628\u0642\u062A \u0646\u062F\u0627\u0631\u062F."
          });
          return;
        }
      }
    }
    next();
  });
};

// server/controllers/adminController.ts
var getDashboardStats = async (req, res) => {
  try {
    const lowStockThreshold = Number(req.query.low_stock_threshold) || 10;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const totalOrders = await Order.count();
    const rawTotalRevenue = await Order.sum("total_price", {
      where: {
        status: {
          [import_sequelize5.Op.ne]: "cancelled"
        }
      }
    });
    const totalRevenue = rawTotalRevenue ? Number(rawTotalRevenue) : 0;
    const lowStockCount = await Product.count({
      where: {
        stock: {
          [import_sequelize5.Op.lte]: lowStockThreshold
        },
        is_active: true
      }
    });
    const newUsersLast30Days = await User.count({
      where: {
        created_at: {
          [import_sequelize5.Op.gte]: thirtyDaysAgo
        }
      }
    });
    const totalProducts = await Product.count({ where: { is_active: true } });
    const totalUsers = await User.count();
    const ordersByStatus = {
      pending: await Order.count({ where: { status: "pending" } }),
      confirmed: await Order.count({ where: { status: "confirmed" } }),
      processing: await Order.count({ where: { status: "processing" } }),
      shipped: await Order.count({ where: { status: "shipped" } }),
      delivered: await Order.count({ where: { status: "delivered" } }),
      cancelled: await Order.count({ where: { status: "cancelled" } })
    };
    const lowStockProducts = await Product.findAll({
      where: {
        stock: { [import_sequelize5.Op.lte]: lowStockThreshold },
        is_active: true
      },
      attributes: ["id", "name", "stock", "price", "brand", "product_type"],
      order: [["stock", "ASC"]],
      limit: 6
    });
    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        low_stock_count: lowStockCount,
        new_users_30d: newUsersLast30Days,
        total_products: totalProducts,
        total_users: totalUsers,
        orders_by_status: ordersByStatus,
        low_stock_products: lowStockProducts,
        calculated_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0645\u062D\u0627\u0633\u0628\u0647 \u0622\u0645\u0627\u0631 \u062F\u0627\u0634\u0628\u0648\u0631\u062F \u0627\u0632 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var adminCreateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category_id,
      product_type,
      required_permit_number,
      brand,
      package_size,
      image_url: bodyImageUrl,
      msds_file_url: bodyMsdsUrl
    } = req.body;
    if (!name || !price || !category_id || !product_type) {
      res.status(400).json({
        success: false,
        message: "\u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0646\u0627\u0645 \u0645\u062D\u0635\u0648\u0644\u060C \u0642\u06CC\u0645\u062A\u060C \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0648 \u0646\u0648\u0639 \u0645\u062D\u0635\u0648\u0644 (\u06A9\u0648\u062F\u060C \u0633\u0645\u060C \u0628\u0630\u0631) \u0627\u0644\u0632\u0627\u0645\u06CC \u0647\u0633\u062A\u0646\u062F"
      });
      return;
    }
    if (bodyImageUrl && typeof bodyImageUrl === "string" && bodyImageUrl.trim() !== "") {
      if (!isValidMediaUrl(bodyImageUrl)) {
        res.status(400).json({
          success: false,
          message: "\u0622\u062F\u0631\u0633 \u062A\u0635\u0648\u06CC\u0631 \u0627\u0631\u0633\u0627\u0644\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F."
        });
        return;
      }
    }
    if (bodyMsdsUrl && typeof bodyMsdsUrl === "string" && bodyMsdsUrl.trim() !== "") {
      if (!isValidMediaUrl(bodyMsdsUrl)) {
        res.status(400).json({
          success: false,
          message: "\u0622\u062F\u0631\u0633 \u0628\u0631\u06AF\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u06CC\u0645\u0646\u06CC MSDS \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F."
        });
        return;
      }
    }
    const category = await Category.findByPk(category_id);
    if (!category) {
      res.status(400).json({
        success: false,
        message: `\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${category_id} \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u0645\u0648\u062C\u0648\u062F \u0646\u06CC\u0633\u062A`
      });
      return;
    }
    const files = req.files;
    let finalImageUrl = bodyImageUrl || null;
    let finalMsdsUrl = bodyMsdsUrl || null;
    if (files) {
      if (files["image"] && files["image"][0]) {
        finalImageUrl = buildAbsoluteUploadUrl(req, `/uploads/products/${files["image"][0].filename}`);
      } else if (files["image_file"] && files["image_file"][0]) {
        finalImageUrl = buildAbsoluteUploadUrl(req, `/uploads/products/${files["image_file"][0].filename}`);
      }
      if (files["msds_file"] && files["msds_file"][0]) {
        finalMsdsUrl = buildAbsoluteUploadUrl(req, `/uploads/msds/${files["msds_file"][0].filename}`);
      }
    } else if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        finalMsdsUrl = buildAbsoluteUploadUrl(req, `/uploads/msds/${req.file.filename}`);
      } else {
        finalImageUrl = buildAbsoluteUploadUrl(req, `/uploads/products/${req.file.filename}`);
      }
    }
    const newProduct = await Product.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      price: Number(price),
      stock: Number(stock || 0),
      category_id: Number(category_id),
      product_type,
      required_permit_number: required_permit_number ? required_permit_number.trim() : null,
      brand: brand ? brand.trim() : null,
      package_size: package_size ? package_size.trim() : null,
      image_url: finalImageUrl,
      msds_file_url: finalMsdsUrl,
      is_active: true
    });
    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [{ model: Category, as: "category" }]
    });
    res.status(201).json({
      success: true,
      message: "\u0645\u062D\u0635\u0648\u0644 \u062C\u062F\u06CC\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062B\u0628\u062A \u0634\u062F",
      data: createdProduct
    });
  } catch (error) {
    console.error("Error in adminCreateProduct:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
};
var adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: `\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
      });
      return;
    }
    const {
      name,
      description,
      price,
      stock,
      category_id,
      product_type,
      required_permit_number,
      brand,
      package_size,
      is_active,
      image_url: bodyImageUrl,
      msds_file_url: bodyMsdsUrl
    } = req.body;
    if (category_id && category_id !== product.category_id) {
      const categoryExists = await Category.findByPk(category_id);
      if (!categoryExists) {
        res.status(400).json({
          success: false,
          message: `\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${category_id} \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
        });
        return;
      }
      product.category_id = Number(category_id);
    }
    if (name !== void 0) product.name = name.trim();
    if (description !== void 0) product.description = description ? description.trim() : null;
    if (price !== void 0) product.price = Number(price);
    if (stock !== void 0) product.stock = Number(stock);
    if (product_type !== void 0) product.product_type = product_type;
    if (required_permit_number !== void 0) product.required_permit_number = required_permit_number ? required_permit_number.trim() : null;
    if (brand !== void 0) product.brand = brand ? brand.trim() : null;
    if (package_size !== void 0) product.package_size = package_size ? package_size.trim() : null;
    if (is_active !== void 0) product.is_active = is_active === "true" || is_active === true;
    if (bodyImageUrl !== void 0 && bodyImageUrl !== null && typeof bodyImageUrl === "string" && bodyImageUrl.trim() !== "") {
      if (!isValidMediaUrl(bodyImageUrl)) {
        res.status(400).json({
          success: false,
          message: "\u0622\u062F\u0631\u0633 \u062A\u0635\u0648\u06CC\u0631 \u0627\u0631\u0633\u0627\u0644\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F."
        });
        return;
      }
      product.image_url = bodyImageUrl.trim();
    }
    if (bodyMsdsUrl !== void 0 && bodyMsdsUrl !== null && typeof bodyMsdsUrl === "string" && bodyMsdsUrl.trim() !== "") {
      if (!isValidMediaUrl(bodyMsdsUrl)) {
        res.status(400).json({
          success: false,
          message: "\u0622\u062F\u0631\u0633 \u0628\u0631\u06AF\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u06CC\u0645\u0646\u06CC MSDS \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F."
        });
        return;
      }
      product.msds_file_url = bodyMsdsUrl.trim();
    }
    const files = req.files;
    if (files) {
      if (files["image"] && files["image"][0]) {
        product.image_url = buildAbsoluteUploadUrl(req, `/uploads/products/${files["image"][0].filename}`);
      } else if (files["image_file"] && files["image_file"][0]) {
        product.image_url = buildAbsoluteUploadUrl(req, `/uploads/products/${files["image_file"][0].filename}`);
      }
      if (files["msds_file"] && files["msds_file"][0]) {
        product.msds_file_url = buildAbsoluteUploadUrl(req, `/uploads/msds/${files["msds_file"][0].filename}`);
      }
    } else if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        product.msds_file_url = buildAbsoluteUploadUrl(req, `/uploads/msds/${req.file.filename}`);
      } else {
        product.image_url = buildAbsoluteUploadUrl(req, `/uploads/products/${req.file.filename}`);
      }
    }
    await product.save();
    const updatedProduct = await Product.findByPk(id, {
      include: [{ model: Category, as: "category" }]
    });
    res.json({
      success: true,
      message: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F",
      data: updatedProduct
    });
  } catch (error) {
    console.error("Error in adminUpdateProduct:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
};
var adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: `\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
      });
      return;
    }
    const orderItemsCount = await OrderItem.count({
      where: { product_id: id }
    });
    if (orderItemsCount > 0) {
      product.is_active = false;
      await product.save();
      res.json({
        success: true,
        action: "deactivated",
        message: `\u0645\u062D\u0635\u0648\u0644 "${product.name}" \u062F\u0631 ${orderItemsCount} \u0633\u0637\u0631 \u0627\u0632 \u0633\u0641\u0627\u0631\u0634\u200C\u0647\u0627\u06CC \u067E\u06CC\u0634\u06CC\u0646 \u0645\u0634\u062A\u0631\u06CC\u0627\u0646 \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F. \u0628\u0647 \u0645\u0646\u0638\u0648\u0631 \u062D\u0641\u0638 \u06CC\u06A9\u067E\u0627\u0631\u0686\u06AF\u06CC \u0633\u0648\u0627\u0628\u0642 \u062D\u0633\u0627\u0628\u062F\u0627\u0631\u06CC \u0648 \u0633\u0641\u0627\u0631\u0634\u0627\u062A\u060C \u0627\u06CC\u0646 \u06A9\u0627\u0644\u0627 \u062D\u0630\u0641 \u0641\u06CC\u0632\u06CC\u06A9\u06CC \u0646\u0634\u062F \u0648 \u0648\u0636\u0639\u06CC\u062A \u0622\u0646 \u0628\u0647 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 (is_active = false) \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A.`,
        data: {
          id: product.id,
          name: product.name,
          is_active: false,
          order_references: orderItemsCount
        }
      });
      return;
    }
    await product.destroy();
    res.json({
      success: true,
      action: "deleted",
      message: `\u0645\u062D\u0635\u0648\u0644 "${product.name}" \u0628\u0647 \u0637\u0648\u0631 \u06A9\u0627\u0645\u0644 \u0627\u0632 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062D\u0630\u0641 \u06AF\u0631\u062F\u06CC\u062F.`,
      data: {
        id: Number(id)
      }
    });
  } catch (error) {
    console.error("Error in adminDeleteProduct:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062D\u0630\u0641 \u06CC\u0627 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
};
var adminCreateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: "\u0646\u0627\u0645 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
      });
      return;
    }
    const existing = await Category.findOne({ where: { name: name.trim() } });
    if (existing) {
      res.status(400).json({
        success: false,
        message: "\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0646\u0627\u0645 \u0627\u0632 \u0642\u0628\u0644 \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F"
      });
      return;
    }
    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : null
    });
    res.status(201).json({
      success: true,
      message: "\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u062C\u062F\u06CC\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u06CC\u062C\u0627\u062F \u0634\u062F",
      data: category
    });
  } catch (error) {
    console.error("Error in adminCreateCategory:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var adminUpdateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: `\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
      });
      return;
    }
    if (name !== void 0) category.name = name.trim();
    if (description !== void 0) category.description = description ? description.trim() : null;
    await category.save();
    res.json({
      success: true,
      message: "\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F",
      data: category
    });
  } catch (error) {
    console.error("Error in adminUpdateCategory:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC",
      ...devError(error)
    });
  }
};
var adminDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: `\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
      });
      return;
    }
    const linkedProductsCount = await Product.count({
      where: { category_id: id }
    });
    if (linkedProductsCount > 0) {
      res.status(400).json({
        success: false,
        message: `\u0627\u0645\u06A9\u0627\u0646 \u062D\u0630\u0641 \u0627\u06CC\u0646 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F\u061B \u062A\u0639\u062F\u0627\u062F ${linkedProductsCount} \u0645\u062D\u0635\u0648\u0644 \u0628\u0647 \u0622\u0646 \u0645\u062A\u0635\u0644 \u0627\u0633\u062A. \u0627\u0628\u062A\u062F\u0627 \u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0631\u0627 \u0645\u0646\u062A\u0642\u0644 \u06CC\u0627 \u062D\u0630\u0641 \u06A9\u0646\u06CC\u062F.`
      });
      return;
    }
    await category.destroy();
    res.json({
      success: true,
      message: "\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F",
      data: { id: Number(id) }
    });
  } catch (error) {
    console.error("Error in adminDeleteCategory:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062D\u0630\u0641 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0632 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var adminGetAllOrders = async (req, res) => {
  try {
    const { status, search, page = "1", limit = "15" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const offset = (pageNum - 1) * limitNum;
    const whereConditions = {};
    if (status && status !== "all") {
      whereConditions.status = status;
    }
    if (search) {
      const searchTerm = String(search).trim();
      whereConditions[import_sequelize5.Op.or] = [
        { tracking_code: { [import_sequelize5.Op.like]: `%${searchTerm}%` } },
        { shipping_address: { [import_sequelize5.Op.like]: `%${searchTerm}%` } }
      ];
    }
    const { count, rows } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "full_name", "phone_number", "farm_location"]
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "product_type", "brand", "image_url"]
            }
          ]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
      distinct: true
    });
    res.json({
      success: true,
      total_count: count,
      total_pages: Math.ceil(count / limitNum),
      current_page: pageNum,
      limit: limitNum,
      data: rows
    });
  } catch (error) {
    console.error("Error in adminGetAllOrders:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0633\u0641\u0627\u0631\u0634\u200C\u0647\u0627\u06CC \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0627\u0632 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var adminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `\u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0645\u0642\u0627\u062F\u06CC\u0631 \u0645\u062C\u0627\u0632: ${validStatuses.join("\u060C ")}`
      });
      return;
    }
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "full_name", "phone_number"]
        }
      ]
    });
    if (!order) {
      res.status(404).json({
        success: false,
        message: `\u0633\u0641\u0627\u0631\u0634 \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F`
      });
      return;
    }
    const oldStatus = order.status;
    order.status = status;
    await order.save();
    res.json({
      success: true,
      message: `\u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 ${order.tracking_code} \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0632 "${oldStatus}" \u0628\u0647 "${status}" \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A`,
      data: {
        id: order.id,
        tracking_code: order.tracking_code,
        old_status: oldStatus,
        new_status: order.status,
        updated_at: order.updated_at
      }
    });
  } catch (error) {
    console.error("Error in adminUpdateOrderStatus:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};

// server/middleware/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0648\u0627\u0631\u062F \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0634\u0648\u06CC\u062F (\u062A\u0648\u06A9\u0646 Bearer \u062F\u0631 \u0647\u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A)"
      });
      return;
    }
    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u062A\u0648\u06A9\u0646 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A"
      });
      return;
    }
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password_hash"] }
    });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "\u06A9\u0627\u0631\u0628\u0631 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u062D\u0630\u0641 \u0634\u062F\u0647 \u0627\u0633\u062A"
      });
      return;
    }
    req.user = user.toJSON();
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A",
      ...devError(error)
    });
  }
};
var authenticateToken = authenticateJWT;
var requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0648\u0627\u0631\u062F \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0634\u0648\u06CC\u062F"
      });
      return;
    }
    const dbUser2 = await User.findByPk(req.user.id);
    if (!dbUser2 || dbUser2.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u0645\u0646\u0648\u0639 (403 Forbidden): \u0627\u06CC\u0646 \u0628\u062E\u0634 \u0645\u0646\u062D\u0635\u0631\u0627\u064B \u062F\u0631 \u0627\u062E\u062A\u06CC\u0627\u0631 \u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 (Admin) \u0645\u06CC\u200C\u0628\u0627\u0634\u062F."
      });
      return;
    }
    req.user = dbUser2.toJSON();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0631\u0633\u06CC \u0633\u0637\u062D \u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062F\u06CC\u0631\u06CC\u062A \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};

// server/middleware/rateLimiter.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var loginRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false
  },
  message: {
    success: false,
    message: "\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0648\u0631\u0648\u062F \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06F1\u06F5 \u062F\u0642\u06CC\u0642\u0647 \u062F\u06CC\u06AF\u0631 \u0645\u062C\u062F\u062F\u0627\u064B \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646\u06CC\u062F."
  }
});
var registerRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false
  },
  message: {
    success: false,
    message: "\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06F1\u06F5 \u062F\u0642\u06CC\u0642\u0647 \u062F\u06CC\u06AF\u0631 \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F."
  }
});
var uploadRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false
  },
  message: {
    success: false,
    message: "\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0622\u067E\u0644\u0648\u062F \u0641\u0627\u06CC\u0644 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06A9\u0645\u06CC \u0628\u0639\u062F \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F."
  }
});

// server/routes/products.ts
var router2 = (0, import_express2.Router)();
router2.get("/", getAllProducts);
router2.get("/:id", getProductById);
router2.post("/", authenticateToken, requireAdmin, uploadRateLimiter, adminProductUpload, adminCreateProduct);
router2.put("/:id", authenticateToken, requireAdmin, uploadRateLimiter, adminProductUpload, adminUpdateProduct);
router2.delete("/:id", authenticateToken, requireAdmin, adminDeleteProduct);
var products_default = router2;

// server/routes/auth.ts
var import_express3 = require("express");

// server/controllers/authController.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);
var register = async (req, res) => {
  try {
    const { phone_number, password, full_name, farm_location } = req.body;
    const existingUser = await User.findOne({
      where: { phone_number }
    });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "\u0627\u06CC\u0646 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0642\u0628\u0644\u0627\u064B \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F."
      });
      return;
    }
    const saltRounds = 10;
    const password_hash = await import_bcryptjs.default.hash(password, saltRounds);
    const newUser = await User.create({
      phone_number,
      password_hash,
      full_name,
      farm_location: farm_location || null,
      role: "customer"
    });
    const token = import_jsonwebtoken3.default.sign(
      {
        id: newUser.id,
        phone_number: newUser.phone_number,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.status(201).json({
      success: true,
      message: "\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06A9\u0634\u0627\u0648\u0631\u0632 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 MySQL \u0627\u06CC\u062C\u0627\u062F \u0634\u062F",
      token,
      user: {
        id: newUser.id,
        phone_number: newUser.phone_number,
        full_name: newUser.full_name,
        farm_location: newUser.farm_location,
        role: newUser.role,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    });
  } catch (error) {
    console.error("\u274C Error during user registration:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
};
var login = async (req, res) => {
  try {
    const { phone_number, password } = req.body;
    const user = await User.findOne({
      where: { phone_number }
    });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A"
      });
      return;
    }
    const isPasswordValid = await import_bcryptjs.default.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A"
      });
      return;
    }
    const token = import_jsonwebtoken3.default.sign(
      {
        id: user.id,
        phone_number: user.phone_number,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.status(200).json({
      success: true,
      message: "\u0648\u0631\u0648\u062F \u0645\u0648\u0641\u0642\u06CC\u062A\u200C\u0622\u0645\u06CC\u0632 \u0628\u0648\u062F",
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        farm_location: user.farm_location,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error("\u274C Error during user login:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u0628\u0631\u0631\u0633\u06CC \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0648\u0631\u0648\u062F",
      ...devError(error)
    });
  }
};
var getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "\u06A9\u0627\u0631\u0628\u0631 \u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A"
      });
      return;
    }
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] }
    });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "\u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 MySQL \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0632 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F",
      user: user.toJSON()
    });
  } catch (error) {
    console.error("\u274C Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631",
      ...devError(error)
    });
  }
};
var updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "\u06A9\u0627\u0631\u0628\u0631 \u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A"
      });
      return;
    }
    const { full_name, farm_location } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "\u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
      });
      return;
    }
    await user.update({
      full_name: full_name !== void 0 ? full_name : user.full_name,
      farm_location: farm_location !== void 0 ? farm_location : user.farm_location
    });
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] }
    });
    res.status(200).json({
      success: true,
      message: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 MySQL \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F",
      user: updatedUser?.toJSON()
    });
  } catch (error) {
    console.error("\u274C Error updating profile in MySQL:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u067E\u0631\u0648\u0641\u0627\u06CC\u0644",
      ...devError(error)
    });
  }
};
var listUsers = async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password_hash"] },
      order: [["id", "DESC"]]
    });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u06A9\u0627\u0631\u0628\u0631\u0627\u0646",
      ...devError(error)
    });
  }
};

// server/middleware/validator.ts
var import_joi = __toESM(require("joi"), 1);
var validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const details = error.details.map((detail) => ({
        message: detail.message,
        field: detail.path.join(".")
      }));
      res.status(400).json({
        success: false,
        message: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0639\u062A\u0628\u0627\u0631\u0633\u0646\u062C\u06CC \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0627\u0631\u0633\u0627\u0644\u06CC",
        errors: details
      });
      return;
    }
    req[property] = value;
    next();
  };
};
var createCategorySchema = import_joi.default.object({
  name: import_joi.default.string().trim().min(2).max(150).required().messages({
    "string.empty": "\u0646\u0627\u0645 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A",
    "string.min": "\u0646\u0627\u0645 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F2 \u062D\u0631\u0641 \u0628\u0627\u0634\u062F",
    "any.required": "\u0646\u0627\u0645 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  description: import_joi.default.string().trim().allow("", null).max(1e3).messages({
    "string.max": "\u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u06F1\u06F0\u06F0\u06F0 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0628\u0627\u0634\u062F"
  })
});
var updateCategorySchema = import_joi.default.object({
  name: import_joi.default.string().trim().min(2).max(150).optional().messages({
    "string.min": "\u0646\u0627\u0645 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F2 \u062D\u0631\u0641 \u0628\u0627\u0634\u062F"
  }),
  description: import_joi.default.string().trim().allow("", null).max(1e3).optional()
}).min(1);
var createProductSchema = import_joi.default.object({
  name: import_joi.default.string().trim().min(2).max(255).required().messages({
    "string.empty": "\u0646\u0627\u0645 \u0645\u062D\u0635\u0648\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A",
    "any.required": "\u0646\u0627\u0645 \u0645\u062D\u0635\u0648\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  description: import_joi.default.string().trim().allow("", null).optional(),
  price: import_joi.default.number().positive().required().messages({
    "number.base": "\u0642\u06CC\u0645\u062A \u0645\u062D\u0635\u0648\u0644 \u0628\u0627\u06CC\u062F \u0639\u062F\u062F \u0645\u0639\u062A\u0628\u0631 \u0628\u0627\u0634\u062F",
    "number.positive": "\u0642\u06CC\u0645\u062A \u0645\u062D\u0635\u0648\u0644 \u0628\u0627\u06CC\u062F \u0628\u0632\u0631\u06AF\u062A\u0631 \u0627\u0632 \u0635\u0641\u0631 \u0628\u0627\u0634\u062F",
    "any.required": "\u0642\u06CC\u0645\u062A \u0645\u062D\u0635\u0648\u0644 \u0628\u0647 \u062A\u0648\u0645\u0627\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  stock: import_joi.default.number().integer().min(0).default(0).messages({
    "number.min": "\u0645\u0648\u062C\u0648\u062F\u06CC \u0627\u0646\u0628\u0627\u0631 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0645\u0646\u0641\u06CC \u0628\u0627\u0634\u062F"
  }),
  category_id: import_joi.default.number().integer().positive().required().messages({
    "number.base": "\u0634\u0646\u0627\u0633\u0647 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A",
    "any.required": "\u0634\u0646\u0627\u0633\u0647 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  image_url: import_joi.default.string().trim().pattern(/^(https?:\/\/|\/?uploads\/)/i).allow("", null).max(500).optional().messages({
    "string.pattern.base": "\u0622\u062F\u0631\u0633 \u062A\u0635\u0648\u06CC\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F"
  }),
  product_type: import_joi.default.string().valid("\u06A9\u0648\u062F", "\u0633\u0645", "\u0628\u0630\u0631").required().messages({
    "any.only": "\u0646\u0648\u0639 \u0645\u062D\u0635\u0648\u0644 \u0628\u0627\u06CC\u062F \u06CC\u06A9\u06CC \u0627\u0632 \u0645\u0648\u0627\u0631\u062F \xAB\u06A9\u0648\u062F\xBB\u060C \xAB\u0633\u0645\xBB \u06CC\u0627 \xAB\u0628\u0630\u0631\xBB \u0628\u0627\u0634\u062F",
    "any.required": "\u0646\u0648\u0639 \u0645\u062D\u0635\u0648\u0644 (\u06A9\u0648\u062F\u060C \u0633\u0645\u060C \u0628\u0630\u0631) \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  required_permit_number: import_joi.default.string().trim().allow("", null).max(100).optional(),
  msds_file_url: import_joi.default.string().trim().pattern(/^(https?:\/\/|\/?uploads\/)/i).allow("", null).max(500).optional().messages({
    "string.pattern.base": "\u0622\u062F\u0631\u0633 \u0628\u0631\u06AF\u0647 \u0627\u06CC\u0645\u0646\u06CC MSDS \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F"
  }),
  brand: import_joi.default.string().trim().allow("", null).max(120).optional(),
  package_size: import_joi.default.string().trim().allow("", null).max(100).optional()
});
var updateProductSchema = import_joi.default.object({
  name: import_joi.default.string().trim().min(2).max(255).optional(),
  description: import_joi.default.string().trim().allow("", null).optional(),
  price: import_joi.default.number().positive().optional().messages({
    "number.base": "\u0642\u06CC\u0645\u062A \u0645\u062D\u0635\u0648\u0644 \u0628\u0627\u06CC\u062F \u0639\u062F\u062F \u0645\u0639\u062A\u0628\u0631 \u0628\u0627\u0634\u062F",
    "number.positive": "\u0642\u06CC\u0645\u062A \u0645\u062D\u0635\u0648\u0644 \u0628\u0627\u06CC\u062F \u0628\u0632\u0631\u06AF\u062A\u0631 \u0627\u0632 \u0635\u0641\u0631 \u0628\u0627\u0634\u062F"
  }),
  stock: import_joi.default.number().integer().min(0).optional(),
  category_id: import_joi.default.number().integer().positive().optional(),
  image_url: import_joi.default.string().trim().pattern(/^(https?:\/\/|\/?uploads\/)/i).allow("", null).max(500).optional().messages({
    "string.pattern.base": "\u0622\u062F\u0631\u0633 \u062A\u0635\u0648\u06CC\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F"
  }),
  product_type: import_joi.default.string().valid("\u06A9\u0648\u062F", "\u0633\u0645", "\u0628\u0630\u0631").optional(),
  required_permit_number: import_joi.default.string().trim().allow("", null).max(100).optional(),
  msds_file_url: import_joi.default.string().trim().pattern(/^(https?:\/\/|\/?uploads\/)/i).allow("", null).max(500).optional().messages({
    "string.pattern.base": "\u0622\u062F\u0631\u0633 \u0628\u0631\u06AF\u0647 \u0627\u06CC\u0645\u0646\u06CC MSDS \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0622\u062F\u0631\u0633 \u0628\u0627\u06CC\u062F \u0628\u0627 http:// \u06CC\u0627 https:// \u06CC\u0627 /uploads/ \u0634\u0631\u0648\u0639 \u0634\u0648\u062F"
  }),
  brand: import_joi.default.string().trim().allow("", null).max(120).optional(),
  package_size: import_joi.default.string().trim().allow("", null).max(100).optional()
}).min(1);
var registerUserSchema = import_joi.default.object({
  phone_number: import_joi.default.string().pattern(/^09[0-9]{9}$/).required().messages({
    "string.pattern.base": "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0628\u0627\u06CC\u062F \u06CC\u06A9 \u0634\u0645\u0627\u0631\u0647 \u0645\u0639\u062A\u0628\u0631 \u06F1\u06F1 \u0631\u0642\u0645\u06CC \u0627\u06CC\u0631\u0627\u0646\u06CC \u0628\u0627\u0634\u062F (\u0645\u062B\u0627\u0644: 09121234567)",
    "any.required": "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  password: import_joi.default.string().min(6).max(100).required().messages({
    "string.min": "\u06A9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631 \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F6 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0628\u0627\u0634\u062F",
    "any.required": "\u06A9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  full_name: import_joi.default.string().trim().min(2).max(150).required().messages({
    "any.required": "\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062E\u0627\u0646\u0648\u0627\u062F\u06AF\u06CC \u06A9\u0634\u0627\u0648\u0631\u0632 / \u06A9\u0627\u0631\u0628\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  farm_location: import_joi.default.string().trim().allow("", null).max(255).optional()
});
var loginUserSchema = import_joi.default.object({
  phone_number: import_joi.default.string().pattern(/^09[0-9]{9}$/).required().messages({
    "string.pattern.base": "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A",
    "any.required": "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  }),
  password: import_joi.default.string().required().messages({
    "any.required": "\u06A9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"
  })
});
var updateProfileSchema = import_joi.default.object({
  full_name: import_joi.default.string().trim().min(2).max(150).optional().messages({
    "string.empty": "\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062E\u0627\u0646\u0648\u0627\u062F\u06AF\u06CC \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F",
    "string.min": "\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062E\u0627\u0646\u0648\u0627\u062F\u06AF\u06CC \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F2 \u062D\u0631\u0641 \u0628\u0627\u0634\u062F"
  }),
  farm_location: import_joi.default.string().trim().allow("", null).max(255).optional()
}).min(1).messages({
  "object.min": "\u062D\u062F\u0627\u0642\u0644 \u06CC\u06A9\u06CC \u0627\u0632 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062E\u0627\u0646\u0648\u0627\u062F\u06AF\u06CC \u06CC\u0627 \u0645\u0648\u0642\u0639\u06CC\u062A \u0645\u0632\u0631\u0639\u0647 \u0628\u0631\u0627\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0628\u0627\u06CC\u062F \u0627\u0631\u0633\u0627\u0644 \u0634\u0648\u062F"
});

// server/routes/auth.ts
var router3 = (0, import_express3.Router)();
router3.post("/register", registerRateLimiter, validate(registerUserSchema), register);
router3.post("/login", loginRateLimiter, validate(loginUserSchema), login);
router3.get("/me", authenticateToken, getMe);
router3.put("/profile", authenticateToken, validate(updateProfileSchema), updateProfile);
router3.get("/users", authenticateToken, requireAdmin, listUsers);
var auth_default = router3;

// server/routes/cart.ts
var import_express4 = require("express");

// server/utils/urlHelper.ts
function toAbsoluteImageUrl(req, imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host") || "localhost:3000"}`;
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${baseUrl}${cleanPath}`;
}

// server/controllers/cartController.ts
async function getFullCartData(userId, req) {
  const cartItems = await Cart.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Product,
        as: "product",
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"]
          }
        ]
      }
    ],
    order: [["created_at", "DESC"]]
  });
  let totalPrice = 0;
  let totalQuantity = 0;
  const formattedItems = cartItems.map((item) => {
    const product = item.product;
    const unitPrice = product ? Number(product.price) : 0;
    const quantity = item.quantity;
    const lineTotal = unitPrice * quantity;
    totalPrice += lineTotal;
    totalQuantity += quantity;
    return {
      id: item.id,
      user_id: item.user_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: product ? {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: product.stock,
        category_id: product.category_id,
        category_name: product.category?.name || "\u0639\u0645\u0648\u0645\u06CC",
        product_type: product.product_type,
        brand: product.brand,
        package_size: product.package_size,
        required_permit_number: product.required_permit_number,
        image_url: toAbsoluteImageUrl(req, product.image_url),
        in_stock: product.stock >= item.quantity
      } : null
    };
  });
  return {
    items: formattedItems,
    summary: {
      total_items: formattedItems.length,
      total_quantity: totalQuantity,
      total_price: totalPrice,
      currency: "\u062A\u0648\u0645\u0627\u0646",
      total_price_formatted: `${totalPrice.toLocaleString("fa-IR")} \u062A\u0648\u0645\u0627\u0646`
    }
  };
}
var getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u0644\u0637\u0641\u0627\u064B \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F"
      });
      return;
    }
    const cartData = await getFullCartData(userId, req);
    res.status(200).json({
      success: true,
      data: cartData
    });
  } catch (error) {
    console.error("\u274C [CartController] Error fetching cart:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0648\u0627\u06A9\u0634\u06CC \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0627\u0632 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0648\u0627\u0631\u062F \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062E\u0648\u062F \u0634\u0648\u06CC\u062F"
      });
      return;
    }
    const { product_id, quantity: rawQuantity } = req.body;
    const productId = parseInt(product_id, 10);
    const quantity = parseInt(rawQuantity, 10) || 1;
    if (!productId || isNaN(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: "\u0634\u0646\u0627\u0633\u0647 \u0645\u062D\u0635\u0648\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A"
      });
      return;
    }
    if (quantity <= 0 || isNaN(quantity)) {
      res.status(400).json({
        success: false,
        message: "\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC \u0628\u0627\u06CC\u062F \u0639\u062F\u062F\u06CC \u0645\u062B\u0628\u062A \u0648 \u062D\u062F\u0627\u0642\u0644 \u06F1 \u0628\u0627\u0634\u062F"
      });
      return;
    }
    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "\u0645\u062D\u0635\u0648\u0644 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u062F\u0631 \u0627\u0646\u0628\u0627\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
      });
      return;
    }
    if (!product.is_active) {
      res.status(400).json({
        success: false,
        message: `\u0645\u062D\u0635\u0648\u0644 \xAB${product.name}\xBB \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062A \u0648 \u0627\u0645\u06A9\u0627\u0646 \u0627\u0641\u0632\u0648\u062F\u0646 \u0622\u0646 \u0628\u0647 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F`
      });
      return;
    }
    if (product.stock <= 0) {
      res.status(400).json({
        success: false,
        message: `\u0645\u062D\u0635\u0648\u0644 \xAB${product.name}\xBB \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u0646\u0627\u0645\u0648\u062C\u0648\u062F \u0627\u0633\u062A (\u0645\u0648\u062C\u0648\u062F\u06CC: \u06F0)`
      });
      return;
    }
    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `\u0645\u0648\u062C\u0648\u062F\u06CC \u0627\u0646\u0628\u0627\u0631 \u06A9\u0627\u0641\u06CC \u0646\u06CC\u0633\u062A. \u062D\u062F\u0627\u06A9\u062B\u0631 \u0645\u0648\u062C\u0648\u062F\u06CC \u0642\u0627\u0628\u0644 \u0633\u0641\u0627\u0631\u0634: ${product.stock} \u0639\u062F\u062F`
      });
      return;
    }
    const existingCartItem = await Cart.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });
    if (existingCartItem) {
      const newTotalQuantity = existingCartItem.quantity + quantity;
      if (newTotalQuantity > product.stock) {
        res.status(400).json({
          success: false,
          message: `\u0645\u062C\u0645\u0648\u0639 \u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC (${newTotalQuantity}) \u0627\u0632 \u0645\u0648\u062C\u0648\u062F\u06CC \u0627\u0646\u0628\u0627\u0631 (${product.stock}) \u0628\u06CC\u0634\u062A\u0631 \u0627\u0633\u062A`
        });
        return;
      }
      await existingCartItem.update({ quantity: newTotalQuantity });
    } else {
      await Cart.create({
        user_id: userId,
        product_id: productId,
        quantity
      });
    }
    const fullCart = await getFullCartData(userId, req);
    res.status(201).json({
      success: true,
      message: `\u0645\u062D\u0635\u0648\u0644 \xAB${product.name}\xBB \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u062B\u0628\u062A \u0634\u062F`,
      data: fullCart
    });
  } catch (error) {
    console.error("\u274C [CartController] Error adding to cart:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    const itemId = parseInt(req.params.itemId, 10);
    const { quantity: rawQuantity } = req.body;
    const quantity = parseInt(rawQuantity, 10);
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632"
      });
      return;
    }
    if (isNaN(itemId) || itemId <= 0) {
      res.status(400).json({
        success: false,
        message: "\u0634\u0646\u0627\u0633\u0647 \u0622\u06CC\u062A\u0645 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A"
      });
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      res.status(400).json({
        success: false,
        message: "\u062A\u0639\u062F\u0627\u062F \u0645\u062D\u0635\u0648\u0644 \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F1 \u0628\u0627\u0634\u062F. \u0628\u0631\u0627\u06CC \u062D\u0630\u0641 \u0627\u0632 \u062F\u06A9\u0645\u0647 \u062D\u0630\u0641 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646\u06CC\u062F"
      });
      return;
    }
    const cartItem = await Cart.findOne({
      where: { id: itemId, user_id: userId },
      include: [{ model: Product, as: "product" }]
    });
    if (!cartItem) {
      res.status(404).json({
        success: false,
        message: "\u0622\u06CC\u062A\u0645 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u062F\u0631 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0634\u0645\u0627 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
      });
      return;
    }
    const product = cartItem.product;
    if (!product) {
      res.status(404).json({
        success: false,
        message: "\u0645\u062D\u0635\u0648\u0644 \u0645\u0631\u062A\u0628\u0637 \u0628\u0627 \u0627\u06CC\u0646 \u0622\u06CC\u062A\u0645 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
      });
      return;
    }
    if (!product.is_active) {
      res.status(400).json({
        success: false,
        message: `\u0645\u062D\u0635\u0648\u0644 \xAB${product.name}\xBB \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0634\u062F\u0647 \u0627\u0633\u062A \u0648 \u0627\u0645\u06A9\u0627\u0646 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0622\u0646 \u062F\u0631 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F`
      });
      return;
    }
    if (quantity > product.stock) {
      res.status(400).json({
        success: false,
        message: `\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC (${quantity}) \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u0645\u0648\u062C\u0648\u062F\u06CC \u0627\u0646\u0628\u0627\u0631 (${product.stock}) \u0627\u0633\u062A`
      });
      return;
    }
    await cartItem.update({ quantity });
    const fullCart = await getFullCartData(userId, req);
    res.status(200).json({
      success: true,
      message: "\u062A\u0639\u062F\u0627\u062F \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F",
      data: fullCart
    });
  } catch (error) {
    console.error("\u274C [CartController] Error updating cart item:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0633\u0628\u062F \u062E\u0631\u06CC\u062F",
      ...devError(error)
    });
  }
};
var removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const itemId = parseInt(req.params.itemId, 10);
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632"
      });
      return;
    }
    if (isNaN(itemId) || itemId <= 0) {
      res.status(400).json({
        success: false,
        message: "\u0634\u0646\u0627\u0633\u0647 \u0622\u06CC\u062A\u0645 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A"
      });
      return;
    }
    const deletedCount = await Cart.destroy({
      where: {
        id: itemId,
        user_id: userId
      }
    });
    if (deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: "\u0622\u06CC\u062A\u0645 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u062F\u0631 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0634\u0645\u0627 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0642\u0628\u0644\u0627\u064B \u062D\u0630\u0641 \u0634\u062F\u0647 \u0627\u0633\u062A"
      });
      return;
    }
    const fullCart = await getFullCartData(userId, req);
    res.status(200).json({
      success: true,
      message: "\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0632 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u062D\u0630\u0641 \u0634\u062F",
      data: fullCart
    });
  } catch (error) {
    console.error("\u274C [CartController] Error removing item from cart:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062D\u0630\u0641 \u0622\u06CC\u062A\u0645 \u0627\u0632 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F",
      ...devError(error)
    });
  }
};
var clearCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632"
      });
      return;
    }
    const count = await Cart.destroy({
      where: { user_id: userId }
    });
    const fullCart = await getFullCartData(userId, req);
    res.status(200).json({
      success: true,
      message: `\u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0634\u0645\u0627 \u062A\u062E\u0644\u06CC\u0647 \u0634\u062F (${count} \u0622\u06CC\u062A\u0645 \u062D\u0630\u0641 \u06AF\u0631\u062F\u06CC\u062F)`,
      data: fullCart
    });
  } catch (error) {
    console.error("\u274C [CartController] Error clearing cart:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u067E\u0627\u06A9\u0633\u0627\u0632\u06CC \u0633\u0628\u062F \u062E\u0631\u06CC\u062F",
      ...devError(error)
    });
  }
};

// server/routes/cart.ts
var router4 = (0, import_express4.Router)();
router4.use(authenticateToken);
router4.get("/", getCart);
router4.post("/", addToCart);
router4.put("/:itemId", updateCartItem);
router4.delete("/:itemId", removeFromCart);
router4.delete("/", clearCart);
var cart_default = router4;

// server/routes/orders.ts
var import_express5 = require("express");

// server/controllers/orderController.ts
function generateTrackingCode() {
  const timestamp = Date.now().toString().slice(-6);
  const randomDigits = Math.floor(1e3 + Math.random() * 9e3);
  return `AGRI-${timestamp}-${randomDigits}`;
}
var createOrder = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0648\u0627\u0631\u062F \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0634\u0648\u06CC\u062F"
    });
    return;
  }
  const { shipping_address: providedAddress } = req.body;
  const shippingAddress = providedAddress && typeof providedAddress === "string" && providedAddress.trim().length > 0 ? providedAddress.trim() : req.user?.farm_location || "\u062B\u0628\u062A \u0634\u062F\u0647 \u062A\u0648\u0633\u0637 \u06A9\u0634\u0627\u0648\u0631\u0632";
  const transaction = await sequelize.transaction();
  try {
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!cartItems || cartItems.length === 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: "\u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0634\u0645\u0627 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062E\u0627\u0644\u06CC \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u0645\u062D\u0635\u0648\u0644\u0627\u062A\u06CC \u0631\u0627 \u0628\u0647 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646\u06CC\u062F."
      });
      return;
    }
    let calculatedGrandTotal = 0;
    const itemsToCreate = [];
    for (const cartItem of cartItems) {
      const product = await Product.findByPk(cartItem.product_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
        // Lock product row for update during transaction to prevent race conditions
      });
      if (!product) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `\u06A9\u0627\u0644\u0627\u06CC \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${cartItem.product_id} \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u0645\u0648\u062C\u0648\u062F \u0646\u06CC\u0633\u062A \u06CC\u0627 \u062D\u0630\u0641 \u06AF\u0631\u062F\u06CC\u062F\u0647 \u0627\u0633\u062A`
        });
        return;
      }
      if (!product.is_active) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `\u062B\u0628\u062A \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F: \u06A9\u0627\u0644\u0627\u06CC \xAB${product.name}\xBB \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062A \u0648 \u0627\u0645\u06A9\u0627\u0646 \u062E\u0631\u06CC\u062F \u0622\u0646 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F`
        });
        return;
      }
      if (product.stock < cartItem.quantity || product.stock <= 0) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `\u062B\u0628\u062A \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F: \u0645\u0648\u062C\u0648\u062F\u06CC \u06A9\u0627\u0644\u0627\u06CC \xAB${product.name}\xBB \u0646\u0627\u06A9\u0627\u0641\u06CC \u0627\u0633\u062A. (\u0645\u0648\u062C\u0648\u062F\u06CC \u0641\u0639\u0644\u06CC \u062F\u0631 \u0627\u0646\u0628\u0627\u0631: ${product.stock} \u0639\u062F\u062F\u060C \u062A\u0639\u062F\u0627\u062F \u062F\u0631 \u0633\u0628\u062F \u0634\u0645\u0627: ${cartItem.quantity} \u0639\u062F\u062F)`
        });
        return;
      }
      const realUnitPrice = Number(product.price);
      const lineTotal = realUnitPrice * cartItem.quantity;
      calculatedGrandTotal += lineTotal;
      itemsToCreate.push({
        product_id: product.id,
        quantity: cartItem.quantity,
        unit_price: realUnitPrice,
        product_name: product.name,
        productInstance: product
      });
    }
    let newOrder = null;
    let attempts = 0;
    const maxAttempts = 5;
    while (!newOrder && attempts < maxAttempts) {
      attempts++;
      const trackingCode = generateTrackingCode();
      try {
        newOrder = await Order.create(
          {
            user_id: userId,
            total_price: calculatedGrandTotal,
            status: "pending",
            shipping_address: shippingAddress,
            tracking_code: trackingCode
          },
          { transaction }
        );
      } catch (err) {
        const isConstraintError = err.name === "SequelizeUniqueConstraintError" || err.parent?.code === "ER_DUP_ENTRY" || err.message?.includes("tracking_code");
        if (attempts < maxAttempts && isConstraintError) {
          console.warn(`[Order] Duplicate tracking_code collision (${trackingCode}), retrying attempt ${attempts + 1}...`);
          continue;
        }
        throw err;
      }
    }
    if (!newOrder) {
      await transaction.rollback();
      res.status(500).json({
        success: false,
        message: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u06A9\u062F \u0631\u0647\u06AF\u06CC\u0631\u06CC \u0645\u0646\u062D\u0635\u0631\u200C\u0628\u0647\u200C\u0641\u0631\u062F \u0633\u0641\u0627\u0631\u0634 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647"
      });
      return;
    }
    for (const item of itemsToCreate) {
      await OrderItem.create(
        {
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        },
        { transaction }
      );
      await item.productInstance.decrement("stock", {
        by: item.quantity,
        transaction
      });
    }
    await Cart.destroy({
      where: { user_id: userId },
      transaction
    });
    await transaction.commit();
    console.log(`\u2705 [Order] Successfully placed order #${newOrder.id} (${newOrder.tracking_code}) for user #${userId}`);
    const createdOrderWithDetails = await Order.findByPk(newOrder.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              include: [{ model: Category, as: "category", attributes: ["id", "name"] }]
            }
          ]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "phone_number", "full_name", "farm_location"]
        }
      ]
    });
    const formattedOrder = createdOrderWithDetails?.toJSON();
    if (formattedOrder && formattedOrder.items) {
      formattedOrder.items.forEach((it) => {
        if (it.product && it.product.image_url) {
          it.product.image_url = toAbsoluteImageUrl(req, it.product.image_url);
        }
      });
    }
    res.status(201).json({
      success: true,
      message: `\u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627 \u0628\u0627 \u06A9\u062F \u067E\u06CC\u06AF\u06CC\u0631\u06CC ${newOrder.tracking_code} \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u062B\u0628\u062A \u06AF\u0631\u062F\u06CC\u062F`,
      data: formattedOrder || newOrder
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback().catch(() => {
      });
    }
    console.error("\u274C [OrderController] Transaction failed:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627\u06CC \u0633\u06CC\u0633\u062A\u0645\u06CC \u062F\u0631 \u062B\u0628\u062A \u062A\u0631\u0627\u06A9\u0646\u0634 \u0633\u0641\u0627\u0631\u0634 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
};
var getOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u0644\u0637\u0641\u0627\u064B \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F"
      });
      return;
    }
    let isUserAdmin = false;
    if (req.query.all === "true") {
      const dbUser2 = await User.findByPk(userId);
      isUserAdmin = dbUser2?.role === "admin";
    }
    const whereClause = isUserAdmin && req.query.all === "true" ? {} : { user_id: userId };
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              include: [{ model: Category, as: "category", attributes: ["id", "name"] }]
            }
          ]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "phone_number", "full_name", "farm_location"]
        }
      ],
      order: [["created_at", "DESC"]]
    });
    const formattedOrders = orders.map((order) => {
      const json = order.toJSON();
      if (json.items) {
        json.items.forEach((it) => {
          if (it.product && it.product.image_url) {
            it.product.image_url = toAbsoluteImageUrl(req, it.product.image_url);
          }
        });
      }
      return json;
    });
    res.status(200).json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error("\u274C [OrderController] Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0648\u0627\u06A9\u0634\u06CC \u0641\u0647\u0631\u0633\u062A \u0633\u0641\u0627\u0631\u0634\u200C\u0647\u0627 \u0627\u0632 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
};
var getOrderById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.orderId, 10);
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632"
      });
      return;
    }
    if (isNaN(orderId) || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: "\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A"
      });
      return;
    }
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              include: [{ model: Category, as: "category", attributes: ["id", "name"] }]
            }
          ]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "phone_number", "full_name", "farm_location"]
        }
      ]
    });
    if (!order) {
      res.status(404).json({
        success: false,
        message: "\u0633\u0641\u0627\u0631\u0634 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
      });
      return;
    }
    if (order.user_id !== userId && req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632: \u0634\u0645\u0627 \u0627\u062C\u0627\u0632\u0647 \u0645\u0634\u0627\u0647\u062F\u0647 \u0627\u06CC\u0646 \u0633\u0641\u0627\u0631\u0634 \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F"
      });
      return;
    }
    const formattedOrder = order.toJSON();
    if (formattedOrder.items) {
      formattedOrder.items.forEach((it) => {
        if (it.product && it.product.image_url) {
          it.product.image_url = toAbsoluteImageUrl(req, it.product.image_url);
        }
      });
    }
    res.status(200).json({
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    console.error("\u274C [OrderController] Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062C\u0632\u0626\u06CC\u0627\u062A \u0633\u0641\u0627\u0631\u0634",
      ...devError(error)
    });
  }
};

// server/routes/orders.ts
var router5 = (0, import_express5.Router)();
router5.use(authenticateToken);
router5.post("/", createOrder);
router5.get("/", getOrders);
router5.get("/:orderId", getOrderById);
var orders_default = router5;

// server/routes/admin.ts
var import_express6 = require("express");
var router6 = (0, import_express6.Router)();
router6.use(authenticateToken);
router6.use(requireAdmin);
router6.get("/dashboard/stats", getDashboardStats);
router6.post("/products", uploadRateLimiter, adminProductUpload, adminCreateProduct);
router6.put("/products/:id", uploadRateLimiter, adminProductUpload, adminUpdateProduct);
router6.delete("/products/:id", adminDeleteProduct);
router6.post("/categories", adminCreateCategory);
router6.put("/categories/:id", adminUpdateCategory);
router6.delete("/categories/:id", adminDeleteCategory);
router6.get("/orders", adminGetAllOrders);
router6.put("/orders/:id/status", adminUpdateOrderStatus);
var admin_default = router6;

// server/routes/system.ts
var import_express7 = require("express");

// server/scripts/seed.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
async function seedDatabase() {
  console.log("\u{1F331} [DB Seed] Starting database seeding with realistic agricultural data...");
  await testConnection();
  await sequelize.sync({ alter: process.env.NODE_ENV !== "production" });
  const categoriesData = [
    {
      name: "\u06A9\u0648\u062F\u0647\u0627\u06CC \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC \u0648 \u0627\u0631\u06AF\u0627\u0646\u06CC\u06A9",
      description: "\u0627\u0646\u0648\u0627\u0639 \u06A9\u0648\u062F\u0647\u0627\u06CC \u06A9\u0627\u0645\u0644 NPK\u060C \u06A9\u0644\u0627\u062A\u200C\u0647\u0627\u06CC \u0631\u06CC\u0632\u0645\u063A\u0630\u06CC\u060C \u0647\u06CC\u0648\u0645\u06CC\u06A9 \u0627\u0633\u06CC\u062F \u0648 \u06A9\u0648\u062F\u0647\u0627\u06CC \u0622\u0644\u06CC \u062A\u0642\u0648\u06CC\u062A \u062E\u0627\u06A9 \u0648 \u0628\u0648\u062A\u0647"
    },
    {
      name: "\u0633\u0645\u0648\u0645 \u062F\u0641\u0639 \u0622\u0641\u0627\u062A \u0648 \u0642\u0627\u0631\u0686\u200C\u06A9\u0634\u200C\u0647\u0627",
      description: "\u0633\u0645\u0648\u0645 \u062D\u0634\u0631\u0647\u200C\u06A9\u0634 \u0633\u06CC\u0633\u062A\u0645\u06CC\u06A9\u060C \u0642\u0627\u0631\u0686\u200C\u06A9\u0634\u200C\u0647\u0627\u06CC \u062A\u0645\u0627\u0633\u06CC \u0648 \u062C\u0630\u0628\u06CC\u060C \u0639\u0644\u0641\u200C\u06A9\u0634\u200C\u0647\u0627\u06CC \u0645\u0632\u0627\u0631\u0639 \u0648 \u0628\u0627\u063A\u06CC \u0628\u0627 \u0645\u062C\u0648\u0632 \u0633\u0627\u0632\u0645\u0627\u0646 \u062D\u0641\u0638 \u0646\u0628\u0627\u062A\u0627\u062A"
    },
    {
      name: "\u0628\u0630\u0648\u0631 \u0632\u0631\u0627\u0639\u06CC \u0648 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0627\u06CC",
      description: "\u0628\u0630\u0648\u0631 \u0647\u06CC\u0628\u0631\u06CC\u062F \u0635\u06CC\u0641\u06CC\u200C\u062C\u0627\u062A\u060C \u062F\u0627\u0646\u0647\u200C\u0647\u0627\u06CC \u0631\u0648\u063A\u0646\u06CC\u060C \u063A\u0644\u0627\u062A \u0648 \u0633\u0628\u0632\u06CC\u062C\u0627\u062A \u0641\u0636\u0627\u06CC \u0628\u0627\u0632 \u0648 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0627\u06CC \u0648\u0627\u0631\u062F\u0627\u062A\u06CC \u0648 \u0627\u0633\u062A\u0627\u0646\u062F\u0627\u0631\u062F"
    },
    {
      name: "\u0645\u062D\u0631\u06A9\u200C\u0647\u0627\u06CC \u0631\u0634\u062F \u0648 \u0628\u0647\u0633\u0627\u0632\u0647\u0627\u06CC \u062E\u0627\u06A9",
      description: "\u0639\u0635\u0627\u0631\u0647 \u062C\u0644\u0628\u06A9 \u062F\u0631\u06CC\u0627\u06CC\u06CC\u060C \u0627\u0633\u06CC\u062F\u0647\u0627\u06CC \u0622\u0645\u06CC\u0646\u0647 \u0636\u062F\u062A\u0646\u0634\u060C \u0628\u06CC\u0648\u0627\u0633\u062A\u06CC\u0645\u0648\u0644\u0627\u0646\u062A\u200C\u0647\u0627 \u0648 \u06AF\u0648\u06AF\u0631\u062F \u06A9\u0634\u0627\u0648\u0631\u0632\u06CC"
    }
  ];
  const categoryMap = /* @__PURE__ */ new Map();
  for (const cat of categoriesData) {
    const [createdCat] = await Category.findOrCreate({
      where: { name: cat.name },
      defaults: cat
    });
    categoryMap.set(cat.name, createdCat.id);
  }
  console.log(`\u2705 Seeded ${categoryMap.size} categories.`);
  const productsData = [
    {
      name: "\u06A9\u0648\u062F \u06A9\u0627\u0645\u0644 NPK 20-20-20 \u06AF\u0631\u06CC\u0646\u200C\u067E\u0644\u0627\u0633 (\u06F1\u06F0 \u06A9\u06CC\u0644\u0648\u06AF\u0631\u0645)",
      description: "\u06A9\u0648\u062F \u067E\u0648\u062F\u0631\u06CC \u06F1\u06F0\u06F0\u066A \u0645\u062D\u0644\u0648\u0644 \u062F\u0631 \u0622\u0628\u060C \u062D\u0627\u0648\u06CC \u0639\u0646\u0627\u0635\u0631 \u0645\u0627\u06A9\u0631\u0648 \u0628\u0647 \u0646\u0633\u0628\u062A \u0645\u0633\u0627\u0648\u06CC \u06F2\u06F0\u066A \u0647\u0645\u0631\u0627\u0647 \u0628\u0627 \u0639\u0646\u0627\u0635\u0631 \u0631\u06CC\u0632\u0645\u063A\u0630\u06CC \u06A9\u0644\u0627\u062A\u0647 (TE). \u0645\u0646\u0627\u0633\u0628 \u062C\u0647\u062A \u062A\u0642\u0648\u06CC\u062A \u0639\u0645\u0648\u0645\u06CC \u062A\u0645\u0627\u0645 \u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0632\u0631\u0627\u0639\u06CC\u060C \u0628\u0627\u063A\u0627\u062A \u067E\u0633\u062A\u0647 \u0648 \u0645\u0631\u06A9\u0628\u0627\u062A \u0648 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0647\u0627 \u062F\u0631 \u062A\u0645\u0627\u0645 \u0645\u0631\u0627\u062D\u0644 \u0631\u0634\u062F\u06CC.",
      price: 98e4,
      stock: 65,
      category_id: categoryMap.get("\u06A9\u0648\u062F\u0647\u0627\u06CC \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC \u0648 \u0627\u0631\u06AF\u0627\u0646\u06CC\u06A9"),
      product_type: "\u06A9\u0648\u062F",
      required_permit_number: "\u06A9\u0648\u062F-\u06F9\u06F8\u06F4\u06F1/\u062E-\u06F1\u06F3\u06F9\u06F9",
      msds_file_url: "/uploads/msds/msds-npk-20-20-20.pdf",
      image_url: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80",
      brand: "\u06AF\u0631\u06CC\u0646\u200C\u067E\u0644\u0627\u0633 \u0647\u0644\u0646\u062F (GreenPlus)",
      package_size: "\u06A9\u06CC\u0633\u0647 \u06F1\u06F0 \u06A9\u06CC\u0644\u0648\u06AF\u0631\u0645\u06CC"
    },
    {
      name: "\u06A9\u0648\u062F \u0647\u06CC\u0648\u0645\u06CC\u06A9 \u0627\u0633\u06CC\u062F \u067E\u062A\u0627\u0633\u06CC\u0645 \u06F9\u06F5\u066A \u06A9\u06CC\u0646\u06AF\u200C\u0647\u0648\u0645 (\u06F1 \u06A9\u06CC\u0644\u0648\u06AF\u0631\u0645)",
      description: "\u062D\u0627\u0648\u06CC \u06F6\u06F5\u066A \u0627\u0633\u06CC\u062F \u0647\u06CC\u0648\u0645\u06CC\u06A9 \u0641\u0639\u0627\u0644\u060C \u06F1\u06F5\u066A \u0627\u0633\u06CC\u062F \u0641\u0648\u0644\u0648\u06CC\u06A9 \u0648 \u06F1\u06F0\u066A \u067E\u062A\u0627\u0633\u06CC\u0645 \u0622\u0644\u06CC. \u0628\u0647\u0628\u0648\u062F \u0633\u0627\u062E\u062A\u0627\u0631 \u0641\u06CC\u0632\u06CC\u06A9\u06CC \u0648 \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC \u062E\u0627\u06A9\u200C\u0647\u0627\u06CC \u0631\u0633\u06CC \u0648 \u0634\u0646\u06CC\u060C \u0627\u0641\u0632\u0627\u06CC\u0634 \u062C\u0630\u0628 \u0639\u0646\u0627\u0635\u0631 \u063A\u0630\u0627\u06CC\u06CC \u0648 \u062A\u062D\u0631\u06CC\u06A9 \u0631\u06CC\u0634\u0647\u200C\u0632\u0627\u06CC\u06CC \u0642\u0648\u06CC \u06AF\u06CC\u0627\u0647.",
      price: 42e4,
      stock: 110,
      category_id: categoryMap.get("\u06A9\u0648\u062F\u0647\u0627\u06CC \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC \u0648 \u0627\u0631\u06AF\u0627\u0646\u06CC\u06A9"),
      product_type: "\u06A9\u0648\u062F",
      required_permit_number: "\u06A9\u0648\u062F-\u06F7\u06F7\u06F3\u06F2/\u0627\u0644\u0641-\u06F1\u06F4\u06F0\u06F1",
      msds_file_url: "/uploads/msds/msds-humic-kinghum.pdf",
      image_url: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800&auto=format&fit=crop&q=80",
      brand: "\u06A9\u06CC\u0646\u06AF\u200C\u0647\u0648\u0645 (KingHum)",
      package_size: "\u067E\u0627\u06A9\u062A \u06F1 \u06A9\u06CC\u0644\u0648\u06AF\u0631\u0645\u06CC \u0632\u06CC\u067E\u200C\u06A9\u06CC\u067E"
    },
    {
      name: "\u06A9\u0648\u062F \u06A9\u0644\u0627\u062A \u0622\u0647\u0646 \u06F6\u066A \u0641\u0631\u0648\u0645\u0633\u062A\u0631 EDDHA \u0627\u0631\u062A\u0648-\u0627\u0631\u062A\u0648 \u06F4.\u06F8",
      description: "\u06A9\u0644\u0627\u062A \u0622\u0647\u0646 \u0628\u0627 \u067E\u0627\u06CC\u062F\u0627\u0631\u06CC \u0628\u0633\u06CC\u0627\u0631 \u0628\u0627\u0644\u0627 \u062F\u0631 \u062E\u0627\u06A9\u200C\u0647\u0627\u06CC \u0642\u0644\u06CC\u0627\u06CC\u06CC \u0648 \u0622\u0647\u06A9\u06CC \u0627\u06CC\u0631\u0627\u0646 \u062A\u0627 pH=11. \u0628\u0631\u0637\u0631\u0641\u200C\u06A9\u0646\u0646\u062F\u0647 \u0633\u0631\u06CC\u0639 \u0639\u0644\u0627\u0626\u0645 \u06A9\u0644\u0631\u0648\u0632 \u0648 \u0632\u0631\u062F\u06CC \u0628\u0631\u06AF\u200C\u0647\u0627 \u0646\u0627\u0634\u06CC \u0627\u0632 \u06A9\u0645\u0628\u0648\u062F \u0622\u0647\u0646 \u062F\u0631 \u0628\u0627\u063A\u0627\u062A \u0648 \u0635\u06CC\u0641\u06CC\u200C\u062C\u0627\u062A.",
      price: 68e4,
      stock: 45,
      category_id: categoryMap.get("\u06A9\u0648\u062F\u0647\u0627\u06CC \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC \u0648 \u0627\u0631\u06AF\u0627\u0646\u06CC\u06A9"),
      product_type: "\u06A9\u0648\u062F",
      required_permit_number: "\u06A9\u0648\u062F-\u06F5\u06F4\u06F1\u06F9/\u0627\u06CC\u0631\u0627\u0646-\u06F1\u06F4\u06F0\u06F0",
      msds_file_url: "/uploads/msds/msds-ferromaster-iron.pdf",
      image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80",
      brand: "\u0641\u0631\u0648\u0645\u0633\u062A\u0631 \u0627\u0633\u067E\u0627\u0646\u06CC\u0627 (Ferromaster)",
      package_size: "\u067E\u0627\u06A9\u062A \u0622\u0644\u0648\u0645\u06CC\u0646\u06CC\u0648\u0645\u06CC \u06F1 \u06A9\u06CC\u0644\u0648\u06AF\u0631\u0645\u06CC"
    },
    {
      name: "\u0633\u0645 \u0642\u0627\u0631\u0686\u200C\u06A9\u0634 \u06A9\u0627\u067E\u062A\u0627\u0646 \u06F8\u06F0\u066A \u067E\u0648\u062F\u0631 \u0648\u062A\u0627\u0628\u0644 (Captan 80% WP)",
      description: "\u0642\u0627\u0631\u0686\u200C\u06A9\u0634 \u062D\u0641\u0627\u0638\u062A\u06CC \u0648 \u062A\u0645\u0627\u0633\u06CC \u0628\u0627 \u0637\u06CC\u0641 \u0627\u062B\u0631 \u06AF\u0633\u062A\u0631\u062F\u0647 \u0628\u0631\u0627\u06CC \u06A9\u0646\u062A\u0631\u0644 \u0644\u06A9\u0647\u200C\u0633\u06CC\u0627\u0647 \u0633\u06CC\u0628 \u0648 \u06AF\u0644\u0627\u0628\u06CC\u060C \u067E\u06CC\u0686\u06CC\u062F\u06AF\u06CC \u0628\u0631\u06AF \u0647\u0644\u0648\u060C \u0633\u0641\u06CC\u062F\u06A9 \u062F\u0627\u062E\u0644\u06CC \u0627\u0646\u06AF\u0648\u0631 \u0648 \u0628\u0648\u062A\u0647\u200C\u0645\u06CC\u0631\u06CC \u0646\u0647\u0627\u0644\u200C\u0647\u0627 \u062F\u0631 \u062E\u0632\u0627\u0646\u0647\u200C\u0647\u0627.",
      price: 35e4,
      stock: 85,
      category_id: categoryMap.get("\u0633\u0645\u0648\u0645 \u062F\u0641\u0639 \u0622\u0641\u0627\u062A \u0648 \u0642\u0627\u0631\u0686\u200C\u06A9\u0634\u200C\u0647\u0627"),
      product_type: "\u0633\u0645",
      required_permit_number: "\u0633\u0645-\u06F3\u06F8\u06F1\u06F9/\u062D-\u0646-\u06F1\u06F4\u06F0\u06F2",
      msds_file_url: "/uploads/msds/msds-captan-80.pdf",
      image_url: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=800&auto=format&fit=crop&q=80",
      brand: "\u0622\u0631\u06CC\u0627 \u0634\u06CC\u0645\u06CC",
      package_size: "\u0642\u0648\u0637\u06CC \u0641\u0644\u0632\u06CC \u06F1 \u06A9\u06CC\u0644\u0648\u06AF\u0631\u0645\u06CC"
    },
    {
      name: "\u0633\u0645 \u062D\u0634\u0631\u0647\u200C\u06A9\u0634 \u06A9\u0646\u0641\u06CC\u062F\u0648\u0631 (\u0627\u06CC\u0645\u06CC\u062F\u0627\u06A9\u0644\u0648\u067E\u0631\u0627\u06CC\u062F \u06F3\u06F5\u066A SC)",
      description: "\u062D\u0634\u0631\u0647\u200C\u06A9\u0634 \u0633\u06CC\u0633\u062A\u0645\u06CC\u06A9 \u0642\u0648\u06CC \u0628\u0627 \u0627\u062B\u0631 \u062A\u0645\u0627\u0633\u06CC \u0648 \u06AF\u0648\u0627\u0631\u0634\u06CC \u0628\u0631\u0627\u06CC \u0645\u0628\u0627\u0631\u0632\u0647 \u0628\u0627 \u0634\u062A\u0647\u200C\u0647\u0627\u060C \u062A\u0631\u06CC\u067E\u0633\u060C \u0633\u0641\u06CC\u062F\u0628\u0627\u0644\u06A9\u200C\u0647\u0627\u060C \u0632\u0646\u062C\u0631\u06A9\u200C\u0647\u0627 \u0648 \u067E\u0633\u06CC\u0644 \u067E\u0633\u062A\u0647. \u0642\u0627\u0628\u0644\u06CC\u062A \u062C\u0630\u0628 \u0628\u0627\u0644\u0627 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0631\u06CC\u0634\u0647 \u0648 \u0628\u0631\u06AF.",
      price: 31e4,
      stock: 140,
      category_id: categoryMap.get("\u0633\u0645\u0648\u0645 \u062F\u0641\u0639 \u0622\u0641\u0627\u062A \u0648 \u0642\u0627\u0631\u0686\u200C\u06A9\u0634\u200C\u0647\u0627"),
      product_type: "\u0633\u0645",
      required_permit_number: "\u0633\u0645-\u06F4\u06F1\u06F1\u06F2/\u062D-\u0646-\u06F1\u06F4\u06F0\u06F1",
      msds_file_url: "/uploads/msds/msds-confidor.pdf",
      image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80",
      brand: "\u0628\u0627\u06CC\u0631 \u0622\u0644\u0645\u0627\u0646 (Bayer CropScience)",
      package_size: "\u0628\u0637\u0631\u06CC \u06F2\u06F5\u06F0 \u0645\u06CC\u0644\u06CC\u200C\u0644\u06CC\u062A\u0631\u06CC"
    },
    {
      name: "\u0633\u0645 \u0642\u0627\u0631\u0686\u200C\u06A9\u0634 \u0631\u06CC\u062F\u0648\u0645\u06CC\u0644 \u06AF\u0644\u062F MZ (\u0645\u0627\u0646\u06A9\u0648\u0632\u0628 \u06F6\u06F4\u066A + \u0645\u062A\u0627\u0644\u0627\u06A9\u0633\u06CC\u0644-\u0627\u0645 \u06F4\u066A)",
      description: "\u0642\u0627\u0631\u0686\u200C\u06A9\u0634 \u062A\u0631\u06A9\u06CC\u0628\u06CC \u0633\u06CC\u0633\u062A\u0645\u06CC\u06A9 \u0648 \u062A\u0645\u0627\u0633\u06CC \u0628\u0631 \u0639\u0644\u06CC\u0647 \u0628\u06CC\u0645\u0627\u0631\u06CC\u200C\u0647\u0627\u06CC \u0633\u0641\u06CC\u062F\u06A9 \u062F\u0631\u0648\u063A\u06CC\u0646 \u0633\u06CC\u0628\u200C\u0632\u0645\u06CC\u0646\u06CC\u060C \u06AF\u0648\u062C\u0647\u200C\u0641\u0631\u0646\u06AF\u06CC \u0648 \u0633\u0641\u06CC\u062F\u06A9 \u062F\u0627\u062E\u0644\u06CC \u062E\u06CC\u0627\u0631. \u0627\u06CC\u062C\u0627\u062F \u0633\u062F \u062F\u0641\u0627\u0639\u06CC \u0645\u0627\u0646\u062F\u06AF\u0627\u0631 \u0628\u0631 \u0633\u0637\u062D \u0628\u0631\u06AF\u200C\u0647\u0627.",
      price: 495e3,
      stock: 50,
      category_id: categoryMap.get("\u0633\u0645\u0648\u0645 \u062F\u0641\u0639 \u0622\u0641\u0627\u062A \u0648 \u0642\u0627\u0631\u0686\u200C\u06A9\u0634\u200C\u0647\u0627"),
      product_type: "\u0633\u0645",
      required_permit_number: "\u0633\u0645-\u06F1\u06F8\u06F9\u06F0/\u0633\u06CC\u0646\u062C\u0646\u062A\u0627-\u06F1\u06F4\u06F0\u06F2",
      msds_file_url: "/uploads/msds/msds-ridomil-gold.pdf",
      image_url: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&auto=format&fit=crop&q=80",
      brand: "\u0633\u06CC\u0646\u062C\u0646\u062A\u0627 \u0633\u0648\u0626\u06CC\u0633 (Syngenta)",
      package_size: "\u0628\u0633\u062A\u0647 \u06F1 \u06A9\u06CC\u0644\u0648\u06AF\u0631\u0645\u06CC"
    },
    {
      name: "\u0633\u0645 \u0639\u0644\u0641\u200C\u06A9\u0634 \u062A\u0648\u0641\u0648\u0631\u062F\u06CC + \u0627\u0645\u200C\u0633\u06CC\u200C\u067E\u06CC\u200C\u0622 (2,4-D + MCPA 67.5% SL)",
      description: "\u0639\u0644\u0641\u200C\u06A9\u0634 \u0627\u0646\u062A\u062E\u0627\u0628\u06CC \u0648 \u0647\u0648\u0631\u0645\u0648\u0646\u06CC \u0628\u0631\u0627\u06CC \u0627\u0632 \u0628\u06CC\u0646 \u0628\u0631\u062F\u0646 \u0639\u0644\u0641\u200C\u0647\u0627\u06CC \u0647\u0631\u0632 \u067E\u0647\u0646\u200C\u0628\u0631\u06AF \u062F\u0631 \u0645\u0632\u0627\u0631\u0639 \u06AF\u0646\u062F\u0645 \u0648 \u062C\u0648. \u062C\u0630\u0628 \u0633\u0631\u06CC\u0639 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0628\u0631\u06AF\u200C\u0647\u0627 \u0648 \u0627\u0646\u062A\u0642\u0627\u0644 \u0628\u0647 \u0645\u0631\u06CC\u0633\u062A\u0645 \u0627\u0646\u062A\u0647\u0627\u06CC\u06CC \u0639\u0644\u0641\u200C\u0647\u0627\u06CC \u0647\u0631\u0632.",
      price: 54e4,
      stock: 60,
      category_id: categoryMap.get("\u0633\u0645\u0648\u0645 \u062F\u0641\u0639 \u0622\u0641\u0627\u062A \u0648 \u0642\u0627\u0631\u0686\u200C\u06A9\u0634\u200C\u0647\u0627"),
      product_type: "\u0633\u0645",
      required_permit_number: "\u0633\u0645-\u06F6\u06F2\u06F0\u06F1/\u062D-\u0646-\u06F1\u06F4\u06F0\u06F0",
      msds_file_url: "/uploads/msds/msds-24d-mcpa.pdf",
      image_url: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800&auto=format&fit=crop&q=80",
      brand: "\u0634\u0631\u06A9\u062A \u06AF\u06CC\u0627\u0647",
      package_size: "\u0628\u0637\u0631\u06CC \u06F1 \u0644\u06CC\u062A\u0631\u06CC \u067E\u0644\u06CC\u200C\u0627\u062A\u06CC\u0644\u0646"
    },
    {
      name: "\u0628\u0630\u0631 \u062E\u06CC\u0627\u0631 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0627\u06CC \u0647\u06CC\u0628\u0631\u06CC\u062F \u0646\u0627\u06AF\u06CC\u0646 (Nagin F1)",
      description: "\u0631\u0642\u0645 \u067E\u0631\u0637\u0631\u0641\u062F\u0627\u0631 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0627\u06CC \u0632\u0648\u062F\u0631\u0633 \u0628\u0627 \u0639\u0645\u0644\u06A9\u0631\u062F \u0628\u0633\u06CC\u0627\u0631 \u0628\u0627\u0644\u0627. \u0637\u0648\u0644 \u0645\u06CC\u0648\u0647 \u06F1\u06F6 \u062A\u0627 \u06F1\u06F8 \u0633\u0627\u0646\u062A\u06CC\u0645\u062A\u0631\u060C \u0645\u06CC\u0648\u0647\u200C\u0647\u0627\u06CC \u0642\u0644\u0645\u06CC \u0648 \u0634\u06CC\u0627\u0631\u062F\u0627\u0631 \u0628\u0647 \u0631\u0646\u06AF \u0633\u0628\u0632 \u062A\u06CC\u0631\u0647\u060C \u0645\u0642\u0627\u0648\u0645 \u0628\u0647 \u0633\u0641\u06CC\u062F\u06A9 \u067E\u0648\u062F\u0631\u06CC \u0648 \u0648\u06CC\u0631\u0648\u0633 \u0645\u0648\u0632\u0627\u06CC\u06CC\u06A9 \u062E\u06CC\u0627\u0631 (CMV).",
      price: 195e4,
      stock: 35,
      category_id: categoryMap.get("\u0628\u0630\u0648\u0631 \u0632\u0631\u0627\u0639\u06CC \u0648 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0627\u06CC"),
      product_type: "\u0628\u0630\u0631",
      required_permit_number: "\u0628\u0630\u0631-\u06F6\u06F6\u06F1\u06F2/\u0628-\u06F1\u06F4\u06F0\u06F3",
      msds_file_url: null,
      image_url: "https://images.unsplash.com/photo-1449339854873-750e6913301b?w=800&auto=format&fit=crop&q=80",
      brand: "\u0627\u0646\u0632\u0627 \u0632\u0627\u062F\u0646 \u0647\u0644\u0646\u062F (Enza Zaden)",
      package_size: "\u067E\u0627\u06A9\u062A \u0627\u0635\u0644\u06CC \u06F5\u06F0\u06F0 \u0639\u062F\u062F\u06CC"
    },
    {
      name: "\u0628\u0630\u0631 \u06AF\u0648\u062C\u0647 \u0641\u0631\u0646\u06AF\u06CC \u0641\u0636\u0627\u06CC \u0628\u0627\u0632 \u0647\u06CC\u0628\u0631\u06CC\u062F \u0645\u062A\u06CC\u0646 (Matin F1)",
      description: "\u0631\u0642\u0645 \u0645\u06CC\u0627\u0646\u200C\u0631\u0633 \u067E\u0631\u0628\u0627\u0631 \u0628\u0627 \u0628\u0648\u062A\u0647 \u0642\u0648\u06CC \u0648 \u067E\u0648\u0634\u0634 \u0628\u0631\u06AF\u06CC \u0639\u0627\u0644\u06CC. \u0648\u0632\u0646 \u0645\u06CC\u0648\u0647 \u06F1\u06F6\u06F0 \u0627\u0644\u06CC \u06F1\u06F8\u06F0 \u06AF\u0631\u0645 \u0628\u0627 \u0633\u0641\u062A\u06CC \u0628\u0627\u0644\u0627 \u0648 \u0642\u0627\u0628\u0644\u06CC\u062A \u062D\u0645\u0644 \u0637\u0648\u0644\u0627\u0646\u06CC\u060C \u0645\u0642\u0627\u0648\u0645 \u0628\u0647 \u0648\u06CC\u0631\u0648\u0633 \u067E\u06CC\u0686\u06CC\u062F\u06AF\u06CC \u0632\u0631\u062F \u06AF\u0648\u062C\u0647\u200C\u0641\u0631\u0646\u06AF\u06CC (TYLCV) \u0648 \u0646\u0645\u0627\u062A\u062F.",
      price: 285e4,
      stock: 22,
      category_id: categoryMap.get("\u0628\u0630\u0648\u0631 \u0632\u0631\u0627\u0639\u06CC \u0648 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0627\u06CC"),
      product_type: "\u0628\u0630\u0631",
      required_permit_number: "\u0628\u0630\u0631-\u06F9\u06F3\u06F0\u06F2/\u0628-\u06F1\u06F4\u06F0\u06F2",
      msds_file_url: null,
      image_url: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop&q=80",
      brand: "\u0633\u06CC\u0646\u062C\u0646\u062A\u0627 \u0633\u0648\u0626\u06CC\u0633 (Syngenta)",
      package_size: "\u0642\u0648\u0637\u06CC \u0627\u0648\u0631\u062C\u06CC\u0646\u0627\u0644 \u06F5\u06F0\u06F0\u06F0 \u0639\u062F\u062F\u06CC"
    },
    {
      name: "\u0628\u0630\u0631 \u0647\u0646\u062F\u0648\u0627\u0646\u0647 \u0647\u06CC\u0628\u0631\u06CC\u062F \u06A9\u0631\u06CC\u0645\u0633\u0648\u0646 \u0633\u0648\u0626\u06CC\u062A \u0622\u0633\u062A\u0631\u0627\u062E\u0627\u0646 (Crimson Sweet F1)",
      description: "\u0647\u0646\u062F\u0648\u0627\u0646\u0647 \u062E\u0637\u06CC \u0628\u06CC\u0636\u06CC\u200C\u0634\u06A9\u0644 \u0628\u0627 \u0639\u0645\u0644\u06A9\u0631\u062F \u0628\u0627\u0644\u0627\u060C \u06AF\u0648\u0634\u062A \u0645\u06CC\u0648\u0647 \u0642\u0631\u0645\u0632 \u062A\u06CC\u0631\u0647 \u0648 \u0628\u0633\u06CC\u0627\u0631 \u0634\u06CC\u0631\u06CC\u0646\u060C \u067E\u0648\u0633\u062A \u0636\u062E\u06CC\u0645 \u0648 \u0645\u0642\u0627\u0648\u0645 \u062F\u0631 \u0628\u0631\u0627\u0628\u0631 \u062A\u0631\u06A9\u200C\u062E\u0648\u0631\u062F\u06AF\u06CC \u0648 \u062D\u0645\u0644 \u0648 \u0646\u0642\u0644 \u0628\u06CC\u0646\u200C\u0634\u0647\u0631\u06CC \u0648 \u0635\u0627\u062F\u0631\u0627\u062A.",
      price: 92e4,
      stock: 40,
      category_id: categoryMap.get("\u0628\u0630\u0648\u0631 \u0632\u0631\u0627\u0639\u06CC \u0648 \u06AF\u0644\u062E\u0627\u0646\u0647\u200C\u0627\u06CC"),
      product_type: "\u0628\u0630\u0631",
      required_permit_number: "\u0628\u0630\u0631-\u06F5\u06F5\u06F4\u06F1/\u0628-\u06F1\u06F4\u06F0\u06F2",
      msds_file_url: null,
      image_url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80",
      brand: "\u0633\u0645\u06CC\u0646\u06CC\u0633 \u0622\u0645\u0631\u06CC\u06A9\u0627 (Seminis)",
      package_size: "\u0642\u0648\u0637\u06CC \u06F1\u06F0\u06F0\u06F0 \u0639\u062F\u062F\u06CC"
    },
    {
      name: "\u0645\u062D\u0631\u06A9 \u0631\u0634\u062F \u0639\u0635\u0627\u0631\u0647 \u062C\u0644\u0628\u06A9 \u062F\u0631\u06CC\u0627\u06CC\u06CC \u0622\u0633\u06A9\u0648 \u06AF\u0631\u0648\u067E (Ascophyllum Nodosum)",
      description: "\u062D\u0627\u0648\u06CC \u0645\u0642\u0627\u062F\u06CC\u0631 \u063A\u0646\u06CC \u0647\u0648\u0631\u0645\u0648\u0646\u200C\u0647\u0627\u06CC \u0637\u0628\u06CC\u0639\u06CC \u06AF\u06CC\u0627\u0647\u06CC (\u0622\u06A9\u0633\u06CC\u0646\u060C \u0633\u06CC\u062A\u0648\u06A9\u06CC\u0646\u06CC\u0646\u060C \u062C\u06CC\u0628\u0631\u0644\u06CC\u0646) \u0648 \u0627\u0633\u06CC\u062F\u0647\u0627\u06CC \u0622\u0645\u06CC\u0646\u0647. \u0627\u0641\u0632\u0627\u06CC\u0634 \u0645\u0642\u0627\u0648\u0645\u062A \u062F\u0631 \u0628\u0631\u0627\u0628\u0631 \u062A\u0646\u0634\u200C\u0647\u0627\u06CC \u0633\u0631\u0645\u0627\u06CC\u06CC\u060C \u062E\u0634\u06A9\u06CC \u0648 \u06AF\u0631\u0645\u0627\u0632\u062F\u06AF\u06CC \u0648 \u0627\u0641\u0632\u0627\u06CC\u0634 \u0634\u0627\u062F\u0627\u0628\u06CC \u06AF\u06CC\u0627\u0647.",
      price: 79e4,
      stock: 55,
      category_id: categoryMap.get("\u0645\u062D\u0631\u06A9\u200C\u0647\u0627\u06CC \u0631\u0634\u062F \u0648 \u0628\u0647\u0633\u0627\u0632\u0647\u0627\u06CC \u062E\u0627\u06A9"),
      product_type: "\u06A9\u0648\u062F",
      required_permit_number: "\u06A9\u0648\u062F-\u06F8\u06F8\u06F4\u06F5/\u0631\u0634\u062F-\u06F1\u06F4\u06F0\u06F1",
      msds_file_url: "/uploads/msds/msds-seaweed-extract.pdf",
      image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80",
      brand: "\u0622\u06AF\u0631\u06CC\u200C\u062A\u06A9 \u0627\u0633\u067E\u0627\u0646\u06CC\u0627",
      package_size: "\u06AF\u0627\u0644\u0646 \u06F1 \u0644\u06CC\u062A\u0631\u06CC \u063A\u0644\u06CC\u0638"
    },
    {
      name: "\u06A9\u0648\u062F \u0627\u0633\u06CC\u062F \u0622\u0645\u06CC\u0646\u0647 \u0622\u0632\u0627\u062F \u06F2\u06F4\u066A \u0622\u0645\u06CC\u0646\u0648\u0648\u06CC\u06AF\u0648\u0631 (Amino Vigor)",
      description: "\u0645\u062C\u0645\u0648\u0639\u0647\u200C\u0627\u06CC \u0627\u0632 \u06F1\u06F8 \u0646\u0648\u0639 \u0627\u0633\u06CC\u062F \u0622\u0645\u06CC\u0646\u0647 \u0622\u0632\u0627\u062F \u0646\u0648\u0639 L \u0628\u0627 \u062C\u0630\u0628 \u0633\u0631\u06CC\u0639 \u062A\u0648\u0633\u0637 \u0631\u0648\u0632\u0646\u0647\u200C\u0647\u0627\u06CC \u0628\u0631\u06AF. \u062A\u0631\u0645\u06CC\u0645 \u0641\u0648\u0631\u06CC \u0622\u0633\u06CC\u0628\u200C\u0647\u0627\u06CC \u0646\u0627\u0634\u06CC \u0627\u0632 \u062A\u0646\u0634 \u0633\u0631\u0645\u0627\u0632\u062F\u06AF\u06CC\u060C \u0637\u0648\u0641\u0627\u0646\u060C \u062A\u06AF\u0631\u06AF \u0648 \u0645\u0633\u0645\u0648\u0645\u06CC\u062A \u0633\u0645\u0648\u0645 \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC.",
      price: 64e4,
      stock: 48,
      category_id: categoryMap.get("\u0645\u062D\u0631\u06A9\u200C\u0647\u0627\u06CC \u0631\u0634\u062F \u0648 \u0628\u0647\u0633\u0627\u0632\u0647\u0627\u06CC \u062E\u0627\u06A9"),
      product_type: "\u06A9\u0648\u062F",
      required_permit_number: "\u06A9\u0648\u062F-\u06F3\u06F2\u06F9\u06F1/\u0631\u0634\u062F-\u06F1\u06F4\u06F0\u06F2",
      msds_file_url: "/uploads/msds/msds-amino-vigor.pdf",
      image_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80",
      brand: "\u0627\u06AF\u0631\u06CC\u06A9\u0648\u0644 \u0627\u06CC\u062A\u0627\u0644\u06CC\u0627 (Agricol)",
      package_size: "\u0628\u0637\u0631\u06CC \u06F1 \u0644\u06CC\u062A\u0631\u06CC"
    }
  ];
  let insertedCount = 0;
  for (const item of productsData) {
    const [_, created] = await Product.findOrCreate({
      where: { name: item.name },
      defaults: item
    });
    if (created) insertedCount++;
  }
  console.log(`\u2705 Seeded ${insertedCount} new products (Total catalog size: ${productsData.length}).`);
  if (process.env.NODE_ENV !== "production") {
    const adminPasswordHash = await import_bcryptjs2.default.hash("admin123456", 10);
    await User.findOrCreate({
      where: { phone_number: "09121234567" },
      defaults: {
        phone_number: "09121234567",
        password_hash: adminPasswordHash,
        full_name: "\u0645\u062F\u06CC\u0631 \u0627\u0631\u0634\u062F \u0633\u0627\u0645\u0627\u0646\u0647 \u0646\u0647\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u06A9\u0634\u0627\u0648\u0631\u0632\u06CC",
        farm_location: "\u062F\u0641\u062A\u0631 \u0645\u0631\u06A9\u0632\u06CC \u062A\u0647\u0631\u0627\u0646 / \u0627\u0633\u062A\u0627\u0646 \u0627\u0644\u0628\u0631\u0632",
        role: "admin"
      }
    });
    const customerPasswordHash = await import_bcryptjs2.default.hash("farmer123456", 10);
    await User.findOrCreate({
      where: { phone_number: "09359876543" },
      defaults: {
        phone_number: "09359876543",
        password_hash: customerPasswordHash,
        full_name: "\u0645\u0647\u0646\u062F\u0633 \u0627\u062D\u0645\u062F \u06A9\u0631\u06CC\u0645\u06CC (\u06A9\u0634\u0627\u0648\u0631\u0632 \u0646\u0645\u0648\u0646\u0647 \u067E\u0633\u062A\u0647)",
        farm_location: "\u0627\u0633\u062A\u0627\u0646 \u06A9\u0631\u0645\u0627\u0646\u060C \u0631\u0641\u0633\u0646\u062C\u0627\u0646",
        role: "customer"
      }
    });
    console.log("\u2705 [Dev] Admin and Customer sample users seeded successfully.");
  } else {
    console.log("\u{1F6E1}\uFE0F [DB Seed] Production mode: Sample admin and customer creation skipped for security.");
    console.log("\u{1F6E1}\uFE0F To create an administrator in production, execute the create-admin script:");
    console.log('\u{1F6E1}\uFE0F   node create-admin.js --phone <PHONE> --password <SECURE_PASSWORD> --name "<NAME>"');
  }
  return { categoriesCount: categoryMap.size, productsCount: productsData.length };
}
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase().then((stats) => {
    console.log(`\u{1F389} Database seeding completed successfully! [Categories: ${stats.categoriesCount}, Products: ${stats.productsCount}]`);
    process.exit(0);
  }).catch((err) => {
    console.error("\u274C Seeding failed with error:", err);
    process.exit(1);
  });
}

// server/scripts/syncDb.ts
async function syncDatabase(options = { alter: true }) {
  console.log("\u{1F504} [DB Sync] Connecting to database and syncing schemas...");
  const conn = await testConnection();
  if (!conn.success) {
    throw new Error(`Failed to connect to database: ${conn.message}`);
  }
  const dialect = sequelize.getDialect();
  if (dialect === "sqlite") {
    await sequelize.sync();
    try {
      const [columns] = await sequelize.query("PRAGMA table_info(products);");
      const hasIsActive = columns.some((col) => col.name === "is_active");
      if (!hasIsActive) {
        console.log("\u2139\uFE0F [DB Migration] Adding is_active column to products table...");
        await sequelize.query("ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1;");
      }
    } catch (e) {
      console.log("\u26A0\uFE0F [DB Migration note on products]:", e.message);
    }
    try {
      const [userCols] = await sequelize.query("PRAGMA table_info(users);");
      const hasRole = userCols.some((col) => col.name === "role");
      if (!hasRole) {
        console.log("\u2139\uFE0F [DB Migration] Adding role column to users table...");
        await sequelize.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer';");
      }
    } catch (e) {
      console.log("\u26A0\uFE0F [DB Migration note on users]:", e.message);
    }
  } else {
    const isProduction3 = process.env.NODE_ENV === "production";
    if (isProduction3) {
      console.log("\u{1F6E1}\uFE0F [DB Sync] Production mode: Running safe sequelize.sync() WITHOUT alter to prevent table corruption.");
      await sequelize.sync();
    } else {
      await sequelize.sync(options);
    }
  }
  console.log("\u2705 [DB Sync] All database tables (Categories, Products, Users, Orders, OrderItems, CartItems) synchronized successfully!");
}
if (process.argv[1]?.endsWith("syncDb.ts") || process.argv[1]?.endsWith("syncDb.js")) {
  syncDatabase({ alter: process.env.NODE_ENV !== "production" }).then(() => {
    console.log("\u{1F680} Database sync process finished.");
    process.exit(0);
  }).catch((err) => {
    console.error("\u274C Database sync failed:", err);
    process.exit(1);
  });
}

// server/routes/system.ts
var router7 = (0, import_express7.Router)();
router7.get("/status", async (req, res) => {
  try {
    const conn = await testConnection();
    let categoriesCount = 0;
    let productsCount = 0;
    let usersCount = 0;
    let ordersCount = 0;
    let cartItemsCount = 0;
    if (conn.success) {
      categoriesCount = await Category.count().catch(() => 0);
      productsCount = await Product.count().catch(() => 0);
      usersCount = await User.count().catch(() => 0);
      ordersCount = await Order.count().catch(() => 0);
      cartItemsCount = await Cart.count().catch(() => 0);
    }
    res.json({
      success: true,
      database: {
        connected: conn.success,
        dialect: conn.dialect,
        status: conn.success ? "operational" : "disconnected",
        connection_pool: {
          max: 10,
          min: 0,
          idle: 1e4
        }
      },
      stats: {
        categories_count: categoriesCount,
        products_count: productsCount,
        users_count: usersCount,
        orders_count: ordersCount,
        cart_items_count: cartItemsCount
      },
      environment: {
        node_env: process.env.NODE_ENV || "development",
        cpanel_compatible: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0648\u0636\u0639\u06CC\u062A \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647",
      ...devError(error)
    });
  }
});
router7.post("/sync", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await syncDatabase({ alter: process.env.NODE_ENV !== "production" });
    res.json({
      success: true,
      message: "\u062C\u062F\u0627\u0648\u0644 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0627 \u0645\u062F\u0644\u200C\u0647\u0627\u06CC Sequelize \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC (Sync) \u0634\u062F\u0646\u062F."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u062C\u062F\u0627\u0648\u0644 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
});
router7.post("/seed", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await seedDatabase();
    res.json({
      success: true,
      message: "\u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0627\u0648\u0644\u06CC\u0647 \u0646\u0645\u0648\u0646\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062F\u0631 \u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 MySQL/Sequelize \u062F\u0631\u062C \u0634\u062F\u0646\u062F.",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u062C \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0646\u0645\u0648\u0646\u0647 \u062F\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633",
      ...devError(error)
    });
  }
});
var system_default = router7;

// server.ts
import_dotenv3.default.config();
var PORT = 3e3;
var isProduction2 = process.env.NODE_ENV === "production";
async function startServer() {
  const app = (0, import_express8.default)();
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  const defaultAllowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://shop.avinia.ir",
    "https://api.shop.avinia.ir",
    "*.run.app",
    "*.googleusercontent.com"
  ];
  const envAllowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : [];
  if (isProduction2 && envAllowedOrigins.length === 0) {
    console.warn("\u26A0\uFE0F [CORS Warning] ALLOWED_ORIGINS environment variable is not defined in production.");
    console.warn(`\u26A0\uFE0F [CORS Warning] Falling back to default allowed production origins: ${defaultAllowedOrigins.join(", ")}`);
  }
  const allowedOriginsList = envAllowedOrigins.length > 0 ? envAllowedOrigins : defaultAllowedOrigins;
  app.use(
    (0, import_cors.default)({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        const isAllowed = allowedOriginsList.some((allowed) => {
          if (allowed === origin) return true;
          if (allowed.startsWith("*.") && origin.endsWith(allowed.slice(1))) {
            return true;
          }
          return false;
        });
        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`\u{1F6AB} [CORS Blocked] Request from unauthorized origin: ${origin}`);
          callback(new Error(`\u062F\u0633\u062A\u0631\u0633\u06CC CORS \u0628\u0631\u0627\u06CC \u0645\u0628\u062F\u0627 ${origin} \u063A\u06CC\u0631\u0645\u062C\u0627\u0632 \u0627\u0633\u062A.`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
    })
  );
  app.use(import_express8.default.json());
  app.use(import_express8.default.urlencoded({ extended: true }));
  const publicDir = import_path3.default.join(process.cwd(), "public");
  const uploadsDir = import_path3.default.join(publicDir, "uploads");
  app.use("/uploads", import_express8.default.static(uploadsDir));
  app.use("/public", import_express8.default.static(publicDir));
  try {
    console.log("\u{1F680} [Server] Initializing database connection...");
    await testConnection();
    await syncDatabase({ alter: !isProduction2 });
    if (!isProduction2) {
      const categoriesCount = await Category.count().catch(() => 0);
      const productsCount = await Product.count().catch(() => 0);
      if (categoriesCount === 0 || productsCount === 0) {
        console.log("\u2139\uFE0F [Server] Catalog empty on startup. Running initial seed (dev mode)...");
        await seedDatabase();
      }
    } else {
      console.log("\u{1F6E1}\uFE0F [Server] Production mode: Automatic seedDatabase is disabled.");
    }
  } catch (dbErr) {
    console.error("\u26A0\uFE0F [Server] Database initialization note:", dbErr.message);
  }
  app.use("/api/v1/auth", auth_default);
  app.use("/api/v1/categories", categories_default);
  app.use("/api/v1/products", products_default);
  app.use("/api/v1/cart", cart_default);
  app.use("/api/v1/orders", orders_default);
  app.use("/api/v1/admin", admin_default);
  app.use("/api/v1/system", system_default);
  app.use("/api/auth", auth_default);
  app.use("/api/categories", categories_default);
  app.use("/api/products", products_default);
  app.use("/api/cart", cart_default);
  app.use("/api/orders", orders_default);
  app.use("/api/admin", admin_default);
  app.use("/api/system", system_default);
  app.get(["/api/health", "/api/v1/health"], (req, res) => {
    res.json({
      success: true,
      status: "ok",
      service: "Agri Inputs Store API (\u06A9\u0648\u062F\u060C \u0633\u0645\u060C \u0628\u0630\u0631)",
      version: "v1.0.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      cpanel_port: PORT
    });
  });
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `\u0645\u0633\u06CC\u0631 API \u06CC\u0627\u0641\u062A \u0646\u0634\u062F: ${req.method} ${req.originalUrl}`,
      ...!isProduction2 && { error: "Not Found" }
    });
  });
  app.use((err, req, res, _next) => {
    if (err && (err.message?.includes("CORS") || err.message?.includes("\u0645\u0628\u062F\u0627") || err.message?.includes("\u062F\u0627\u0645\u0646\u0647"))) {
      res.status(403).json({
        success: false,
        message: err.message || "\u062F\u0633\u062A\u0631\u0633\u06CC \u0627\u0632 \u0627\u06CC\u0646 \u0645\u0628\u062F\u0623 (Origin) \u062A\u0648\u0633\u0637 \u0633\u06CC\u0627\u0633\u062A \u0627\u0645\u0646\u06CC\u062A\u06CC CORS \u0645\u0633\u062F\u0648\u062F \u0634\u062F",
        ...devError(err)
      });
      return;
    }
    if (err && (err instanceof import_multer2.default.MulterError || err.name === "MulterError")) {
      let statusCode2 = 400;
      let userMessage = "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0641\u0627\u06CC\u0644 \u0627\u0631\u0633\u0627\u0644\u06CC";
      if (err.code === "LIMIT_FILE_SIZE") {
        statusCode2 = 413;
        userMessage = "\u062D\u062C\u0645 \u0641\u0627\u06CC\u0644 \u0627\u0631\u0633\u0627\u0644\u06CC \u0628\u06CC\u0634 \u0627\u0632 \u0633\u0642\u0641 \u0645\u062C\u0627\u0632 (\u06F1\u06F0 \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A) \u0627\u0633\u062A";
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        statusCode2 = 400;
        userMessage = `\u0641\u06CC\u0644\u062F \u0627\u0631\u0633\u0627\u0644\u06CC \u0641\u0627\u06CC\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A: ${err.field || "\u0646\u0627\u0645\u0634\u062E\u0635"}`;
      } else if (err.code === "LIMIT_FILE_COUNT") {
        statusCode2 = 400;
        userMessage = "\u062A\u0639\u062F\u0627\u062F \u0641\u0627\u06CC\u0644\u200C\u0647\u0627\u06CC \u0627\u0631\u0633\u0627\u0644\u06CC \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A";
      }
      console.warn(`\u26A0\uFE0F [Multer Error] ${err.code}: ${err.message}`);
      res.status(statusCode2).json({
        success: false,
        message: userMessage,
        ...devError(err)
      });
      return;
    }
    if (err && err.message && (err.message.includes("\u0641\u0631\u0645\u062A \u062A\u0635\u0648\u06CC\u0631") || err.message.includes("\u0641\u0631\u0645\u062A \u0628\u0631\u06AF\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A"))) {
      res.status(400).json({
        success: false,
        message: err.message,
        ...devError(err)
      });
      return;
    }
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({
        success: false,
        message: "\u0641\u0631\u0645\u062A \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC JSON \u0627\u0631\u0633\u0627\u0644\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A",
        ...devError(err)
      });
      return;
    }
    console.error("\u274C [Central Error Handler] Unhandled exception:", err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode < 500 && err.message ? err.message : "\u062E\u0637\u0627\u06CC \u062F\u0627\u062E\u0644\u06CC \u0633\u0631\u0648\u0631 \u0631\u062E \u062F\u0627\u062F\u0647 \u0627\u0633\u062A",
      ...devError(err)
    });
  });
  if (!isProduction2) {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path3.default.join(process.cwd(), "dist");
    const indexPath = import_path3.default.join(distPath, "index.html");
    if (import_fs3.default.existsSync(distPath)) {
      app.use(import_express8.default.static(distPath));
    }
    app.get("*", (req, res) => {
      if (import_fs3.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.json({
          status: "online",
          service: "AgriStore REST API Server",
          domain: "api.shop.avinia.ir",
          frontend_domain: "shop.avinia.ir",
          health_check: "/api/v1/health",
          message: "Web service is active and ready for client requests."
        });
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F33F} [AgriStore Server] Listening on http://0.0.0.0:${PORT} (PORT=${PORT})`);
    console.log(`\u{1F4E6} Database-backed API v1 Endpoints:`);
    console.log(`   - POST                /api/v1/auth/register, /api/v1/auth/login`);
    console.log(`   - GET/PUT             /api/v1/auth/me, /api/v1/auth/profile`);
    console.log(`   - GET/POST/PUT/DELETE /api/v1/cart`);
    console.log(`   - POST/GET            /api/v1/orders, /api/v1/orders/:orderId`);
    console.log(`   - GET/POST/PUT/DELETE /api/v1/products, /api/v1/categories`);
  });
}
startServer().catch((err) => {
  console.error("\u274C Fatal server startup error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
