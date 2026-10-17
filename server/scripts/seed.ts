import bcrypt from 'bcryptjs';
import { sequelize, testConnection } from '../config/database.js';
import { Category, Product, User } from '../models/index.js';

export async function seedDatabase(): Promise<{ categoriesCount: number; productsCount: number }> {
  console.log('🌱 [DB Seed] Starting database seeding with realistic agricultural data...');
  
  await testConnection();
  await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });

  // 1. Seed Categories
  const categoriesData = [
    {
      name: 'کودهای شیمیایی و ارگانیک',
      description: 'انواع کودهای کامل NPK، کلات‌های ریزمغذی، هیومیک اسید و کودهای آلی تقویت خاک و بوته',
    },
    {
      name: 'سموم دفع آفات و قارچ‌کش‌ها',
      description: 'سموم حشره‌کش سیستمیک، قارچ‌کش‌های تماسی و جذبی، علف‌کش‌های مزارع و باغی با مجوز سازمان حفظ نباتات',
    },
    {
      name: 'بذور زراعی و گلخانه‌ای',
      description: 'بذور هیبرید صیفی‌جات، دانه‌های روغنی، غلات و سبزیجات فضای باز و گلخانه‌ای وارداتی و استاندارد',
    },
    {
      name: 'محرک‌های رشد و بهسازهای خاک',
      description: 'عصاره جلبک دریایی، اسیدهای آمینه ضدتنش، بیواستیمولانت‌ها و گوگرد کشاورزی',
    },
  ];

  const categoryMap = new Map<string, number>();

  for (const cat of categoriesData) {
    const [createdCat] = await Category.findOrCreate({
      where: { name: cat.name },
      defaults: cat,
    });
    categoryMap.set(cat.name, createdCat.id);
  }

  console.log(`✅ Seeded ${categoryMap.size} categories.`);

  // 2. Seed Realistic Products
  const productsData = [
    {
      name: 'کود کامل NPK 20-20-20 گرین‌پلاس (۱۰ کیلوگرم)',
      description: 'کود پودری ۱۰۰٪ محلول در آب، حاوی عناصر ماکرو به نسبت مساوی ۲۰٪ همراه با عناصر ریزمغذی کلاته (TE). مناسب جهت تقویت عمومی تمام محصولات زراعی، باغات پسته و مرکبات و گلخانه‌ها در تمام مراحل رشدی.',
      price: 980000,
      stock: 65,
      category_id: categoryMap.get('کودهای شیمیایی و ارگانیک')!,
      product_type: 'کود' as const,
      required_permit_number: 'کود-۹۸۴۱/خ-۱۳۹۹',
      msds_file_url: '/uploads/msds/msds-npk-20-20-20.pdf',
      image_url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80',
      brand: 'گرین‌پلاس هلند (GreenPlus)',
      package_size: 'کیسه ۱۰ کیلوگرمی',
    },
    {
      name: 'کود هیومیک اسید پتاسیم ۹۵٪ کینگ‌هوم (۱ کیلوگرم)',
      description: 'حاوی ۶۵٪ اسید هیومیک فعال، ۱۵٪ اسید فولویک و ۱۰٪ پتاسیم آلی. بهبود ساختار فیزیکی و شیمیایی خاک‌های رسی و شنی، افزایش جذب عناصر غذایی و تحریک ریشه‌زایی قوی گیاه.',
      price: 420000,
      stock: 110,
      category_id: categoryMap.get('کودهای شیمیایی و ارگانیک')!,
      product_type: 'کود' as const,
      required_permit_number: 'کود-۷۷۳۲/الف-۱۴۰۱',
      msds_file_url: '/uploads/msds/msds-humic-kinghum.pdf',
      image_url: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800&auto=format&fit=crop&q=80',
      brand: 'کینگ‌هوم (KingHum)',
      package_size: 'پاکت ۱ کیلوگرمی زیپ‌کیپ',
    },
    {
      name: 'کود کلات آهن ۶٪ فرومستر EDDHA ارتو-ارتو ۴.۸',
      description: 'کلات آهن با پایداری بسیار بالا در خاک‌های قلیایی و آهکی ایران تا pH=11. برطرف‌کننده سریع علائم کلروز و زردی برگ‌ها ناشی از کمبود آهن در باغات و صیفی‌جات.',
      price: 680000,
      stock: 45,
      category_id: categoryMap.get('کودهای شیمیایی و ارگانیک')!,
      product_type: 'کود' as const,
      required_permit_number: 'کود-۵۴۱۹/ایران-۱۴۰۰',
      msds_file_url: '/uploads/msds/msds-ferromaster-iron.pdf',
      image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
      brand: 'فرومستر اسپانیا (Ferromaster)',
      package_size: 'پاکت آلومینیومی ۱ کیلوگرمی',
    },
    {
      name: 'سم قارچ‌کش کاپتان ۸۰٪ پودر وتابل (Captan 80% WP)',
      description: 'قارچ‌کش حفاظتی و تماسی با طیف اثر گسترده برای کنترل لکه‌سیاه سیب و گلابی، پیچیدگی برگ هلو، سفیدک داخلی انگور و بوته‌میری نهال‌ها در خزانه‌ها.',
      price: 350000,
      stock: 85,
      category_id: categoryMap.get('سموم دفع آفات و قارچ‌کش‌ها')!,
      product_type: 'سم' as const,
      required_permit_number: 'سم-۳۸۱۹/ح-ن-۱۴۰۲',
      msds_file_url: '/uploads/msds/msds-captan-80.pdf',
      image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=800&auto=format&fit=crop&q=80',
      brand: 'آریا شیمی',
      package_size: 'قوطی فلزی ۱ کیلوگرمی',
    },
    {
      name: 'سم حشره‌کش کنفیدور (ایمیداکلوپراید ۳۵٪ SC)',
      description: 'حشره‌کش سیستمیک قوی با اثر تماسی و گوارشی برای مبارزه با شته‌ها، تریپس، سفیدبالک‌ها، زنجرک‌ها و پسیل پسته. قابلیت جذب بالا از طریق ریشه و برگ.',
      price: 310000,
      stock: 140,
      category_id: categoryMap.get('سموم دفع آفات و قارچ‌کش‌ها')!,
      product_type: 'سم' as const,
      required_permit_number: 'سم-۴۱۱۲/ح-ن-۱۴۰۱',
      msds_file_url: '/uploads/msds/msds-confidor.pdf',
      image_url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80',
      brand: 'بایر آلمان (Bayer CropScience)',
      package_size: 'بطری ۲۵۰ میلی‌لیتری',
    },
    {
      name: 'سم قارچ‌کش ریدومیل گلد MZ (مانکوزب ۶۴٪ + متالاکسیل-ام ۴٪)',
      description: 'قارچ‌کش ترکیبی سیستمیک و تماسی بر علیه بیماری‌های سفیدک دروغین سیب‌زمینی، گوجه‌فرنگی و سفیدک داخلی خیار. ایجاد سد دفاعی ماندگار بر سطح برگ‌ها.',
      price: 495000,
      stock: 50,
      category_id: categoryMap.get('سموم دفع آفات و قارچ‌کش‌ها')!,
      product_type: 'سم' as const,
      required_permit_number: 'سم-۱۸۹۰/سینجنتا-۱۴۰۲',
      msds_file_url: '/uploads/msds/msds-ridomil-gold.pdf',
      image_url: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&auto=format&fit=crop&q=80',
      brand: 'سینجنتا سوئیس (Syngenta)',
      package_size: 'بسته ۱ کیلوگرمی',
    },
    {
      name: 'سم علف‌کش توفوردی + ام‌سی‌پی‌آ (2,4-D + MCPA 67.5% SL)',
      description: 'علف‌کش انتخابی و هورمونی برای از بین بردن علف‌های هرز پهن‌برگ در مزارع گندم و جو. جذب سریع از طریق برگ‌ها و انتقال به مریستم انتهایی علف‌های هرز.',
      price: 540000,
      stock: 60,
      category_id: categoryMap.get('سموم دفع آفات و قارچ‌کش‌ها')!,
      product_type: 'سم' as const,
      required_permit_number: 'سم-۶۲۰۱/ح-ن-۱۴۰۰',
      msds_file_url: '/uploads/msds/msds-24d-mcpa.pdf',
      image_url: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800&auto=format&fit=crop&q=80',
      brand: 'شرکت گیاه',
      package_size: 'بطری ۱ لیتری پلی‌اتیلن',
    },
    {
      name: 'بذر خیار گلخانه‌ای هیبرید ناگین (Nagin F1)',
      description: 'رقم پرطرفدار گلخانه‌ای زودرس با عملکرد بسیار بالا. طول میوه ۱۶ تا ۱۸ سانتیمتر، میوه‌های قلمی و شیاردار به رنگ سبز تیره، مقاوم به سفیدک پودری و ویروس موزاییک خیار (CMV).',
      price: 1950000,
      stock: 35,
      category_id: categoryMap.get('بذور زراعی و گلخانه‌ای')!,
      product_type: 'بذر' as const,
      required_permit_number: 'بذر-۶۶۱۲/ب-۱۴۰۳',
      msds_file_url: null,
      image_url: 'https://images.unsplash.com/photo-1449339854873-750e6913301b?w=800&auto=format&fit=crop&q=80',
      brand: 'انزا زادن هلند (Enza Zaden)',
      package_size: 'پاکت اصلی ۵۰۰ عددی',
    },
    {
      name: 'بذر گوجه فرنگی فضای باز هیبرید متین (Matin F1)',
      description: 'رقم میان‌رس پربار با بوته قوی و پوشش برگی عالی. وزن میوه ۱۶۰ الی ۱۸۰ گرم با سفتی بالا و قابلیت حمل طولانی، مقاوم به ویروس پیچیدگی زرد گوجه‌فرنگی (TYLCV) و نماتد.',
      price: 2850000,
      stock: 22,
      category_id: categoryMap.get('بذور زراعی و گلخانه‌ای')!,
      product_type: 'بذر' as const,
      required_permit_number: 'بذر-۹۳۰۲/ب-۱۴۰۲',
      msds_file_url: null,
      image_url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop&q=80',
      brand: 'سینجنتا سوئیس (Syngenta)',
      package_size: 'قوطی اورجینال ۵۰۰۰ عددی',
    },
    {
      name: 'بذر هندوانه هیبرید کریمسون سوئیت آستراخان (Crimson Sweet F1)',
      description: 'هندوانه خطی بیضی‌شکل با عملکرد بالا، گوشت میوه قرمز تیره و بسیار شیرین، پوست ضخیم و مقاوم در برابر ترک‌خوردگی و حمل و نقل بین‌شهری و صادرات.',
      price: 920000,
      stock: 40,
      category_id: categoryMap.get('بذور زراعی و گلخانه‌ای')!,
      product_type: 'بذر' as const,
      required_permit_number: 'بذر-۵۵۴۱/ب-۱۴۰۲',
      msds_file_url: null,
      image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
      brand: 'سمینیس آمریکا (Seminis)',
      package_size: 'قوطی ۱۰۰۰ عددی',
    },
    {
      name: 'محرک رشد عصاره جلبک دریایی آسکو گروپ (Ascophyllum Nodosum)',
      description: 'حاوی مقادیر غنی هورمون‌های طبیعی گیاهی (آکسین، سیتوکینین، جیبرلین) و اسیدهای آمینه. افزایش مقاومت در برابر تنش‌های سرمایی، خشکی و گرمازدگی و افزایش شادابی گیاه.',
      price: 790000,
      stock: 55,
      category_id: categoryMap.get('محرک‌های رشد و بهسازهای خاک')!,
      product_type: 'کود' as const,
      required_permit_number: 'کود-۸۸۴۵/رشد-۱۴۰۱',
      msds_file_url: '/uploads/msds/msds-seaweed-extract.pdf',
      image_url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80',
      brand: 'آگری‌تک اسپانیا',
      package_size: 'گالن ۱ لیتری غلیظ',
    },
    {
      name: 'کود اسید آمینه آزاد ۲۴٪ آمینوویگور (Amino Vigor)',
      description: 'مجموعه‌ای از ۱۸ نوع اسید آمینه آزاد نوع L با جذب سریع توسط روزنه‌های برگ. ترمیم فوری آسیب‌های ناشی از تنش سرمازدگی، طوفان، تگرگ و مسمومیت سموم شیمیایی.',
      price: 640000,
      stock: 48,
      category_id: categoryMap.get('محرک‌های رشد و بهسازهای خاک')!,
      product_type: 'کود' as const,
      required_permit_number: 'کود-۳۲۹۱/رشد-۱۴۰۲',
      msds_file_url: '/uploads/msds/msds-amino-vigor.pdf',
      image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      brand: 'اگریکول ایتالیا (Agricol)',
      package_size: 'بطری ۱ لیتری',
    },
  ];

  let insertedCount = 0;
  for (const item of productsData) {
    const [_, created] = await Product.findOrCreate({
      where: { name: item.name },
      defaults: item,
    });
    if (created) insertedCount++;
  }

  console.log(`✅ Seeded ${insertedCount} new products (Total catalog size: ${productsData.length}).`);

  // 3. Seed Default Admin & Customer Users (DEVELOPMENT / STAGING ONLY)
  if (process.env.NODE_ENV !== 'production') {
    const adminPasswordHash = await bcrypt.hash('admin123456', 10);
    await User.findOrCreate({
      where: { phone_number: '09121234567' },
      defaults: {
        phone_number: '09121234567',
        password_hash: adminPasswordHash,
        full_name: 'مدیر ارشد سامانه نهاده‌های کشاورزی',
        farm_location: 'دفتر مرکزی تهران / استان البرز',
        role: 'admin',
      },
    });

    // Seed Default Customer User
    const customerPasswordHash = await bcrypt.hash('farmer123456', 10);
    await User.findOrCreate({
      where: { phone_number: '09359876543' },
      defaults: {
        phone_number: '09359876543',
        password_hash: customerPasswordHash,
        full_name: 'مهندس احمد کریمی (کشاورز نمونه پسته)',
        farm_location: 'استان کرمان، رفسنجان',
        role: 'customer',
      },
    });

    console.log('✅ [Dev] Admin and Customer sample users seeded successfully.');
  } else {
    console.log('🛡️ [DB Seed] Production mode: Sample admin and customer creation skipped for security.');
    console.log('🛡️ To create an administrator in production, execute the create-admin script:');
    console.log('🛡️   node create-admin.js --phone <PHONE> --password <SECURE_PASSWORD> --name "<NAME>"');
  }

  return { categoriesCount: categoryMap.size, productsCount: productsData.length };
}

// Run directly if called via CLI: tsx server/scripts/seed.ts
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then((stats) => {
      console.log(`🎉 Database seeding completed successfully! [Categories: ${stats.categoriesCount}, Products: ${stats.productsCount}]`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed with error:', err);
      process.exit(1);
    });
}
