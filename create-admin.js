// server/scripts/createAdmin.ts
import bcrypt from "bcryptjs";
import dotenv2 from "dotenv";

// server/config/database.ts
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config();
var isProduction = process.env.NODE_ENV === "production";
var dbHost = process.env.DB_HOST || "localhost";
var dbPort = parseInt(process.env.DB_PORT || "3306", 10);
var dbName = process.env.DB_NAME || "agri_store_db";
var dbUser = process.env.DB_USER || "root";
var dbPassword = process.env.DB_PASSWORD || "";
var isMysqlConfigured = process.env.DB_DIALECT === "mysql" && (process.env.FORCE_MYSQL === "true" || process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1" || isProduction && process.env.DB_PASSWORD !== void 0);
var dbDialect = isMysqlConfigured ? "mysql" : process.env.DB_DIALECT || "sqlite";
var dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
var sequelize;
if (dbDialect === "mysql") {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
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
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(dataDir, "agri_store.sqlite"),
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
import { DataTypes, Model } from "sequelize";
var Category = class extends Model {
};
Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
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
var Product = class extends Model {
};
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(14, 0),
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
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    product_type: {
      type: DataTypes.ENUM("\u06A9\u0648\u062F", "\u0633\u0645", "\u0628\u0630\u0631"),
      allowNull: false,
      validate: {
        isIn: [["\u06A9\u0648\u062F", "\u0633\u0645", "\u0628\u0630\u0631"]]
      }
    },
    required_permit_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "\u0634\u0645\u0627\u0631\u0647 \u0645\u062C\u0648\u0632 \u0633\u0627\u0632\u0645\u0627\u0646 \u062D\u0641\u0638 \u0646\u0628\u0627\u062A\u0627\u062A \u06CC\u0627 \u0645\u0648\u0633\u0633\u0647 \u062A\u062D\u0642\u06CC\u0642\u0627\u062A \u062E\u0627\u06A9 \u0648 \u0622\u0628"
    },
    msds_file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "\u0622\u062F\u0631\u0633 \u0641\u0627\u06CC\u0644 \u0628\u0631\u06AF\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u06CC\u0645\u0646\u06CC \u0645\u0648\u0627\u062F \u0634\u06CC\u0645\u06CC\u0627\u06CC\u06CC MSDS"
    },
    brand: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    package_size: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
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
var User = class extends Model {
};
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    farm_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "\u0645\u0648\u0642\u0639\u06CC\u062A \u06CC\u0627 \u0627\u0633\u062A\u0627\u0646/\u0634\u0647\u0631 \u0645\u0632\u0631\u0639\u0647 \u06A9\u0634\u0627\u0648\u0631\u0632"
    },
    role: {
      type: DataTypes.ENUM("customer", "admin"),
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
var Order = class extends Model {
};
Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    total_price: {
      type: DataTypes.DECIMAL(14, 0),
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
      type: DataTypes.ENUM("pending", "confirmed", "processing", "shipped", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending"
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tracking_code: {
      type: DataTypes.STRING(100),
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
var OrderItem = class extends Model {
};
OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(14, 0),
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
var Cart = class extends Model {
};
Cart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    quantity: {
      type: DataTypes.INTEGER,
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

// server/scripts/createAdmin.ts
dotenv2.config();
async function createAdminUser(options) {
  console.log("\u{1F6E1}\uFE0F [Create-Admin Script] Running Admin Account Creation...");
  const args = process.argv.slice(2);
  let phone = options?.phone || process.env.ADMIN_PHONE || "";
  let password = options?.password || process.env.ADMIN_PASSWORD || "";
  let name = options?.name || process.env.ADMIN_NAME || "\u0645\u062F\u06CC\u0631 \u0627\u0631\u0634\u062F \u0633\u0627\u0645\u0627\u0646\u0647 \u0646\u0647\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u06A9\u0634\u0627\u0648\u0631\u0632\u06CC";
  let location = options?.location || process.env.ADMIN_LOCATION || "\u062F\u0641\u062A\u0631 \u0645\u0631\u06A9\u0632\u06CC \u062A\u0647\u0631\u0627\u0646 / \u0627\u0633\u062A\u0627\u0646 \u0627\u0644\u0628\u0631\u0632";
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--phone" || args[i] === "-p") && args[i + 1]) {
      phone = args[i + 1];
      i++;
    } else if ((args[i] === "--password" || args[i] === "-pwd") && args[i + 1]) {
      password = args[i + 1];
      i++;
    } else if ((args[i] === "--name" || args[i] === "-n") && args[i + 1]) {
      name = args[i + 1];
      i++;
    } else if ((args[i] === "--location" || args[i] === "-l") && args[i + 1]) {
      location = args[i + 1];
      i++;
    }
  }
  if (!phone || !password) {
    console.error("\n\u274C [Security Error] Phone number and password are required to create an administrator.");
    console.error("\u274C Usage with CLI arguments:");
    console.error('   node create-admin.js --phone 0912XXXXXXX --password YOUR_SECURE_PASSWORD --name "\u0646\u0627\u0645 \u0645\u062F\u06CC\u0631"');
    console.error("\u274C Or via environment variables:");
    console.error("   ADMIN_PHONE=0912XXXXXXX ADMIN_PASSWORD=YOUR_PASSWORD node create-admin.js\n");
    throw new Error("Missing required admin parameters: --phone and --password must be explicitly provided.");
  }
  await testConnection();
  const existingUser = await User.findOne({ where: { phone_number: phone } });
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  if (existingUser) {
    console.log(`\u2139\uFE0F [Create-Admin] User with phone ${phone} already exists. Promoting role to 'admin' and updating password...`);
    existingUser.role = "admin";
    existingUser.password_hash = passwordHash;
    existingUser.full_name = name;
    if (location) existingUser.farm_location = location;
    await existingUser.save();
    console.log("====================================================");
    console.log("\u2705 [SUCCESS] Admin user successfully updated in MySQL database:");
    console.log(`   - ID: ${existingUser.id}`);
    console.log(`   - Phone Number: ${existingUser.phone_number}`);
    console.log(`   - Full Name: ${existingUser.full_name}`);
    console.log(`   - Role: ${existingUser.role} (ADMIN)`);
    console.log("====================================================");
    return existingUser;
  } else {
    console.log(`\u2139\uFE0F [Create-Admin] Creating new administrator with phone ${phone}...`);
    const newAdmin = await User.create({
      phone_number: phone,
      password_hash: passwordHash,
      full_name: name,
      farm_location: location,
      role: "admin"
    });
    console.log("====================================================");
    console.log("\u2705 [SUCCESS] New Admin user successfully created in MySQL database:");
    console.log(`   - ID: ${newAdmin.id}`);
    console.log(`   - Phone Number: ${newAdmin.phone_number}`);
    console.log(`   - Full Name: ${newAdmin.full_name}`);
    console.log(`   - Role: ${newAdmin.role} (ADMIN)`);
    console.log("====================================================");
    return newAdmin;
  }
}
if (process.argv[1]?.includes("createAdmin") || process.argv[1]?.includes("create-admin")) {
  createAdminUser().then(() => {
    console.log("\u{1F512} Security Notice: Do not expose admin creation endpoints via public HTTP routes.");
    process.exit(0);
  }).catch((err) => {
    console.error("\u274C Failed to create admin user:", err);
    process.exit(1);
  });
}
export {
  createAdminUser
};
