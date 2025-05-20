// Sample blog post data
export const blogPosts = [
  {
    id: 'first-post',
    slug: 'first-post-welcome-to-monkeyz-world',
    title: {
      en: 'Welcome to the MonkeyZ World!',
      he: 'ברוכים הבאים לעולם של MonkeyZ!',
    },
    date: 'May 19, 2025',
    author: 'The MonkeyZ Team',
    image: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=800&q=80', // Placeholder image
    summary: {
      en: 'Discover the latest news, updates, and insights from the MonkeyZ team. We are excited to share our journey with you.',
      he: 'גלו את החדשות האחרונות, עדכונים ותובנות מצוות MonkeyZ. אנו נרגשים לחלוק אתכם את המסע שלנו.',
    },
    content: {
      en: `
        <p>Welcome to the official MonkeyZ blog! We're thrilled to launch this space where we'll be sharing insights, news, and updates about our products, the tech world, and much more. Our mission is to provide you with top-notch digital solutions and keep you informed every step of the way.</p>
        <p>In this first post, we want to extend a warm welcome to all our users, partners, and anyone interested in the innovative world of MonkeyZ. We believe in transparency, quality, and community, and this blog will be a testament to those values.</p>
        <h2 class="text-2xl font-semibold my-4">What to Expect</h2>
        <ul class="list-disc list-inside space-y-2">
          <li><strong>Product Updates:</strong> Get the latest on new features, improvements, and upcoming releases.</li>
          <li><strong>Industry Insights:</strong> Explore trends and discussions in the tech and digital services industry.</li>
          <li><strong>Tutorials & Tips:</strong> Learn how to make the most of MonkeyZ products with our helpful guides.</li>
          <li><strong>Community Spotlights:</strong> Hear stories from our users and how they leverage MonkeyZ for their success.</li>
        </ul>
        <p class="mt-4">Stay tuned for more exciting content. We're just getting started!</p>
      `,
      he: `
        <p>ברוכים הבאים לבלוג הרשמי של MonkeyZ! אנו נרגשים להשיק את המרחב הזה בו נשתף תובנות, חדשות ועדכונים על המוצרים שלנו, עולם הטכנולוגיה ועוד הרבה יותר. המשימה שלנו היא לספק לכם פתרונות דיגיטליים מהשורה הראשונה ולעדכן אתכם בכל שלב.</p>
        <p>בפוסט הראשון הזה, אנו רוצים להודות בחום לכל המשתמשים, השותפים שלנו, ולכל מי שמתעניין בעולם החדשני של MonkeyZ. אנו מאמינים בשקיפות, איכות וקהילה, והבלוג הזה יהיה עדות לערכים אלו.</p>
        <h2 class="text-2xl font-semibold my-4">למה לצפות</h2>
        <ul class="list-disc list-inside space-y-2">
          <li><strong>עדכוני מוצרים:</strong> קבלו את המידע העדכני ביותר על תכונות חדשות, שיפורים וגרסאות קרובות.</li>
          <li><strong>תובנות מהתעשייה:</strong> גלו מגמות ודיונים בתעשיית הטכנולוגיה והשירותים הדיגיטליים.</li>
          <li><strong>מדריכים וטיפים:</strong> למדו כיצד להפיק את המרב ממוצרי MonkeyZ בעזרת המדריכים המועילים שלנו.</li>
          <li><strong>זרקור על הקהילה:</strong> שמעו סיפורים מהמשתמשים שלנו וכיצד הם ממנפים את MonkeyZ להצלחתם.</li>
        </ul>
        <p class="mt-4">הישארו מעודכנים לתוכן מרגש נוסף. אנחנו רק מתחילים!</p>
      `,
    },
  },
  {
    id: 'second-post',
    slug: 'second-post-boosting-productivity-tools',
    title: {
      en: 'Top 5 Tools to Boost Your Productivity in 2025',
      he: '5 הכלים המובילים להגברת הפרודוקטיביות שלך ב-2025',
    },
    date: 'May 22, 2025',
    author: 'Jane Doe, Productivity Expert',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80', // Placeholder image
    summary: {
      en: 'In today\'s fast-paced world, productivity is key. We explore five essential tools that can help you achieve more.',
      he: 'בעולם המהיר של היום, פרודוקטיביות היא המפתח. אנו בוחנים חמישה כלים חיוניים שיכולים לעזור לך להשיג יותר.',
    },
    content: {
      en: `
        <p>Productivity isn't just about working harder; it's about working smarter. With the right tools, you can streamline your workflow, manage your time effectively, and achieve your goals faster. Here are our top 5 picks for 2025:</p>
        <h3 class="text-xl font-semibold my-3">1. MonkeyZ TaskMaster</h3>
        <p>Our very own TaskMaster helps you organize projects, track progress, and collaborate seamlessly with your team. It's designed to be intuitive and powerful.</p>
        <h3 class="text-xl font-semibold my-3">2. FocusFlow Pomodoro Timer</h3>
        <p>A simple yet effective Pomodoro timer app that helps you stay focused by breaking down work into manageable intervals.</p>
        <h3 class="text-xl font-semibold my-3">3. CloudSync Pro</h3>
        <p>Keep all your files synchronized across devices with CloudSync Pro. Reliable, secure, and fast.</p>
        <h3 class="text-xl font-semibold my-3">4. IdeaSpark Notes</h3>
        <p>A minimalist note-taking app that helps you capture ideas quickly and organize them efficiently.</p>
        <h3 class="text-xl font-semibold my-3">5. ConnectSphere Communicator</h3>
        <p>A unified communication platform that brings all your chats, calls, and meetings into one place.</p>
        <p class="mt-4">Integrating these tools into your daily routine can make a significant difference. What are your favorite productivity tools? Share in the comments!</p>
      `,
      he: `
        <p>פרודוקטיביות אינה רק עבודה קשה יותר; היא עבודה חכמה יותר. בעזרת הכלים הנכונים, תוכלו לייעל את זרימת העבודה שלכם, לנהל את הזמן ביעילות ולהשיג את המטרות שלכם מהר יותר. הנה 5 הבחירות המובילות שלנו לשנת 2025:</p>
        <h3 class="text-xl font-semibold my-3">1. MonkeyZ TaskMaster</h3>
        <p>ה-TaskMaster שלנו עוזר לכם לארגן פרויקטים, לעקוב אחר התקדמות ולשתף פעולה בצורה חלקה עם הצוות שלכם. הוא תוכנן להיות אינטואיטיבי ועוצמתי.</p>
        <h3 class="text-xl font-semibold my-3">2. FocusFlow Pomodoro Timer</h3>
        <p>אפליקציית טיימר פומודורו פשוטה אך יעילה שעוזרת לכם להישאר ממוקדים על ידי חלוקת העבודה למרווחים ניתנים לניהול.</p>
        <h3 class="text-xl font-semibold my-3">3. CloudSync Pro</h3>
        <p>שמרו על כל הקבצים שלכם מסונכרנים בין מכשירים עם CloudSync Pro. אמין, מאובטח ומהיר.</p>
        <h3 class="text-xl font-semibold my-3">4. IdeaSpark Notes</h3>
        <p>אפליקציית רישום הערות מינימליסטית שעוזרת לכם לתפוס רעיונות במהירות ולארגן אותם ביעילות.</p>
        <h3 class="text-xl font-semibold my-3">5. ConnectSphere Communicator</h3>
        <p>פלטפורמת תקשורת מאוחדת המאגדת את כל הצ'אטים, השיחות והפגישות שלכם במקום אחד.</p>
        <p class="mt-4">שילוב כלים אלו בשגרת היומיום שלכם יכול לעשות הבדל משמעותי. מהם כלי הפרודוקטיביות האהובים עליכם? שתפו בתגובות!</p>
      `,
    },
  },
  {
    id: 'third-post',
    slug: 'third-post-future-of-digital-security',
    title: {
      en: 'The Future of Digital Security: Trends to Watch',
      he: 'עתיד האבטחה הדיגיטלית: מגמות שכדאי לעקוב אחריהן',
    },
    date: 'May 25, 2025',
    author: 'Alex Secure',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80', // Placeholder image
    summary: {
      en: 'Digital security is evolving rapidly. We delve into the key trends that will shape the landscape of online safety.',
      he: 'האבטחה הדיגיטלית מתפתחת במהירות. אנו מתעמקים במגמות המפתח שיעצבו את נוף הבטיחות המקוונת.',
    },
    content: {
      en: `
        <p>As our lives become increasingly digital, the importance of robust security measures cannot be overstated. The threat landscape is constantly evolving, and so are the technologies designed to protect us. Here are some key trends in digital security to keep an eye on:</p>
        <h3 class="text-xl font-semibold my-3">1. AI-Powered Threat Detection</h3>
        <p>Artificial intelligence is playing a crucial role in identifying and neutralizing threats in real-time, often before they can cause significant damage.</p>
        <h3 class="text-xl font-semibold my-3">2. Zero Trust Architecture</h3>
        <p>The "never trust, always verify" approach is becoming a standard, requiring strict identity verification for every person and device trying to access resources on a private network.</p>
        <h3 class="text-xl font-semibold my-3">3. Emphasis on Data Privacy</h3>
        <p>With regulations like GDPR and CCPA, there's a growing focus on user data privacy and how companies collect, store, and use personal information.</p>
        <h3 class="text-xl font-semibold my-3">4. Rise of Biometric Authentication</h3>
        <p>Fingerprint scanners, facial recognition, and other biometric methods are becoming more common for secure and convenient authentication.</p>
        <p class="mt-4">Staying informed about these trends is crucial for both individuals and businesses. MonkeyZ is committed to integrating the latest security advancements into our products to keep you safe.</p>
      `,
      he: `
        <p>ככל שחיינו הופכים ליותר ויותר דיגיטליים, אי אפשר להפריז בחשיבותם של אמצעי אבטחה חזקים. נוף האיומים מתפתח כל הזמן, וכך גם הטכנולוגיות שנועדו להגן עלינו. הנה כמה מגמות מפתח באבטחה דיגיטלית שכדאי לשים לב אליהן:</p>
        <h3 class="text-xl font-semibold my-3">1. זיהוי איומים מבוסס בינה מלאכותית</h3>
        <p>בינה מלאכותית ממלאת תפקיד מכריע בזיהוי ונטרול איומים בזמן אמת, לעתים קרובות לפני שהם יכולים לגרום נזק משמעותי.</p>
        <h3 class="text-xl font-semibold my-3">2. ארכיטקטורת Zero Trust</h3>
        <p>גישת "לעולם אל תסמוך, תמיד תאמת" הופכת לסטנדרט, הדורשת אימות זהות קפדני עבור כל אדם ומכשיר המנסים לגשת למשאבים ברשת פרטית.</p>
        <h3 class="text-xl font-semibold my-3">3. דגש על פרטיות נתונים</h3>
        <p>עם תקנות כמו GDPR ו-CCPA, ישנו דגש גובר על פרטיות נתוני משתמשים וכיצד חברות אוספות, מאחסנות ומשתמשות במידע אישי.</p>
        <h3 class="text-xl font-semibold my-3">4. עליית האימות הביומטרי</h3>
        <p>סורקי טביעות אצבע, זיהוי פנים ושיטות ביומטריות אחרות הופכות נפוצות יותר לאימות מאובטח ונוח.</p>
        <p class="mt-4">הישארות מעודכנת לגבי מגמות אלו חיונית הן לאנשים פרטיים והן לעסקים. MonkeyZ מחויבת לשלב את חידושי האבטחה האחרונים במוצריה כדי לשמור על בטיחותכם.</p>
      `,
    },
  },
];

export const getPostById = (id) => blogPosts.find(post => post.id === id);
export const getPostBySlug = (slug) => blogPosts.find(post => post.slug === slug);
