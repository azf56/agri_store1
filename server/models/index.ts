import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

// ==========================================
// 1. CATEGORY MODEL
// ==========================================
export interface CategoryAttributes {
  id: number;
  name: string;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 2. PRODUCT MODEL
// ==========================================
export type ProductType = 'کود' | 'سم' | 'بذر';

export interface ProductAttributes {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  category_id: number;
  image_url?: string | null;
  product_type: ProductType;
  required_permit_number?: string | null; // شماره پروانه / مجوز ثبت
  msds_file_url?: string | null; // فایل برگه اطلاعات ایمنی مواد شیمیایی
  brand?: string | null;
  package_size?: string | null;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public stock!: number;
  public category_id!: number;
  public image_url!: string | null;
  public product_type!: ProductType;
  public required_permit_number!: string | null;
  public msds_file_url!: string | null;
  public brand!: string | null;
  public package_size!: string | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association mixins
  public readonly category?: Category;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(14, 0), // Prices in Iranian Tomans
      allowNull: false,
      validate: {
        min: 0,
      },
      get() {
        const rawValue = this.getDataValue('price');
        return rawValue ? Number(rawValue) : 0;
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    product_type: {
      type: DataTypes.ENUM('کود', 'سم', 'بذر'),
      allowNull: false,
      validate: {
        isIn: [['کود', 'سم', 'بذر']],
      },
    },
    required_permit_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'شماره مجوز سازمان حفظ نباتات یا موسسه تحقیقات خاک و آب',
    },
    msds_file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'آدرس فایل برگه اطلاعات ایمنی مواد شیمیایی MSDS',
    },
    brand: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    package_size: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'وضعیت فعال/غیرفعال بودن محصول در کاتالوگ',
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 3. USER MODEL
// ==========================================
export interface UserAttributes {
  id: number;
  phone_number: string;
  password_hash: string;
  full_name: string;
  farm_location?: string | null;
  role?: 'customer' | 'admin';
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public phone_number!: string;
  public password_hash!: string;
  public full_name!: string;
  public farm_location!: string | null;
  public role!: 'customer' | 'admin';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    farm_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'موقعیت یا استان/شهر مزرعه کشاورز',
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 4. ORDER MODEL
// ==========================================
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderAttributes {
  id: number;
  user_id: number;
  total_price: number;
  status: OrderStatus;
  shipping_address?: string | null;
  tracking_code?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public user_id!: number;
  public total_price!: number;
  public status!: OrderStatus;
  public shipping_address!: string | null;
  public tracking_code!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly user?: User;
  public readonly items?: OrderItem[];
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    total_price: {
      type: DataTypes.DECIMAL(14, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
      get() {
        const val = this.getDataValue('total_price');
        return val ? Number(val) : 0;
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tracking_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 5. ORDER ITEM MODEL
// ==========================================
export interface OrderItemAttributes {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id'> {}

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public order_id!: number;
  public product_id!: number;
  public quantity!: number;
  public unit_price!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly product?: Product;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    unit_price: {
      type: DataTypes.DECIMAL(14, 0),
      allowNull: false,
      validate: {
        min: 0,
      },
      get() {
        const val = this.getDataValue('unit_price');
        return val ? Number(val) : 0;
      },
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: true,
    underscored: true,
  }
);

// ==========================================
// 6. CART MODEL (DATABASE PERSISTENCE RULE)
// ==========================================
export interface CartAttributes {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CartCreationAttributes extends Optional<CartAttributes, 'id'> {}

export class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  public id!: number;
  public user_id!: number;
  public product_id!: number;
  public quantity!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly product?: Product;
  public readonly user?: User;
}

Cart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    tableName: 'carts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id'],
      },
    ],
  }
);

// Backward-compatible alias
export const CartItem = Cart;
export type CartItemAttributes = CartAttributes;
export type CartItemCreationAttributes = CartCreationAttributes;

// ==========================================
// MODEL ASSOCIATIONS
// ==========================================

// Category <-> Product (1 to Many)
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products',
});
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
});

// User <-> Order (1 to Many)
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
});
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Order <-> OrderItem (1 to Many)
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// Product <-> OrderItem (1 to Many)
Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'order_items',
});
OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// User <-> Cart (1 to Many)
User.hasMany(Cart, {
  foreignKey: 'user_id',
  as: 'cart',
});
User.hasMany(Cart, {
  foreignKey: 'user_id',
  as: 'cart_items',
});
Cart.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Product <-> Cart (1 to Many)
Product.hasMany(Cart, {
  foreignKey: 'product_id',
  as: 'cart_entries',
});
Cart.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

export { sequelize };
export default {
  sequelize,
  Category,
  Product,
  User,
  Order,
  OrderItem,
  Cart,
  CartItem,
};
