import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type LanguageCode = 'en' | 'ta' | 'hi' | 'ml' | 'te' | 'kn' | 'bn' | 'mr' | 'gu' | 'pa' | 'ur' | 'ar';

export const SUPPORTED_LANGUAGES: Array<{ code: LanguageCode; label: string; nativeLabel: string; rtl?: boolean }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' }, { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' }, { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' }, { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' }, { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' }, { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', rtl: true }, { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', rtl: true },
];

const common: Record<LanguageCode, Record<string, string>> = {
  en: { Dashboard: 'Dashboard', Requests: 'Requests', Timetable: 'Timetable', Notifications: 'Notifications', Profile: 'Profile', Settings: 'Settings', Save: 'Save', Cancel: 'Cancel', Download: 'Download', Share: 'Share', Delete: 'Delete', Search: 'Search', More: 'More', 'Sign Out': 'Sign Out', 'Page not found': 'Page not found', 'Access denied': 'Access denied' },
  ta: { Dashboard: 'முகப்பு', Requests: 'கோரிக்கைகள்', Timetable: 'கால அட்டவணை', Notifications: 'அறிவிப்புகள்', Profile: 'சுயவிவரம்', Settings: 'அமைப்புகள்', Save: 'சேமி', Cancel: 'ரத்து', Download: 'பதிவிறக்கு', Share: 'பகிர்', Delete: 'நீக்கு', Search: 'தேடு', More: 'மேலும்', 'Sign Out': 'வெளியேறு', 'Page not found': 'பக்கம் கிடைக்கவில்லை', 'Access denied': 'அணுகல் மறுக்கப்பட்டது' },
  hi: { Dashboard: 'डैशबोर्ड', Requests: 'अनुरोध', Timetable: 'समय-सारणी', Notifications: 'सूचनाएँ', Profile: 'प्रोफ़ाइल', Settings: 'सेटिंग्स', Save: 'सहेजें', Cancel: 'रद्द करें', Download: 'डाउनलोड', Share: 'साझा करें', Delete: 'हटाएँ', Search: 'खोजें', More: 'अधिक', 'Sign Out': 'साइन आउट', 'Page not found': 'पृष्ठ नहीं मिला', 'Access denied': 'पहुँच अस्वीकृत' },
  ml: { Dashboard: 'ഡാഷ്ബോർഡ്', Requests: 'അഭ്യർത്ഥനകൾ', Timetable: 'സമയപ്പട്ടിക', Notifications: 'അറിയിപ്പുകൾ', Profile: 'പ്രൊഫൈൽ', Settings: 'ക്രമീകരണങ്ങൾ', Save: 'സംരക്ഷിക്കുക', Cancel: 'റദ്ദാക്കുക', Download: 'ഡൗൺലോഡ്', Share: 'പങ്കിടുക', Delete: 'ഇല്ലാതാക്കുക', Search: 'തിരയുക', More: 'കൂടുതൽ', 'Sign Out': 'പുറത്തുകടക്കുക', 'Page not found': 'പേജ് കണ്ടെത്തിയില്ല', 'Access denied': 'പ്രവേശനം നിരസിച്ചു' },
  te: { Dashboard: 'డ్యాష్‌బోర్డ్', Requests: 'అభ్యర్థనలు', Timetable: 'సమయ పట్టిక', Notifications: 'నోటిఫికేషన్లు', Profile: 'ప్రొఫైల్', Settings: 'సెట్టింగ్‌లు', Save: 'సేవ్ చేయి', Cancel: 'రద్దు', Download: 'డౌన్‌లోడ్', Share: 'షేర్', Delete: 'తొలగించు', Search: 'వెతుకు', More: 'మరిన్ని', 'Sign Out': 'సైన్ అవుట్', 'Page not found': 'పేజీ కనబడలేదు', 'Access denied': 'ప్రవేశం నిరాకరించబడింది' },
  kn: { Dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', Requests: 'ವಿನಂತಿಗಳು', Timetable: 'ವೇಳಾಪಟ್ಟಿ', Notifications: 'ಅಧಿಸೂಚನೆಗಳು', Profile: 'ಪ್ರೊಫೈಲ್', Settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', Save: 'ಉಳಿಸಿ', Cancel: 'ರದ್ದು', Download: 'ಡೌನ್‌ಲೋಡ್', Share: 'ಹಂಚಿಕೊಳ್ಳಿ', Delete: 'ಅಳಿಸಿ', Search: 'ಹುಡುಕಿ', More: 'ಇನ್ನಷ್ಟು', 'Sign Out': 'ಸೈನ್ ಔಟ್', 'Page not found': 'ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ', 'Access denied': 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ' },
  bn: { Dashboard: 'ড্যাশবোর্ড', Requests: 'অনুরোধ', Timetable: 'সময়সূচি', Notifications: 'বিজ্ঞপ্তি', Profile: 'প্রোফাইল', Settings: 'সেটিংস', Save: 'সংরক্ষণ', Cancel: 'বাতিল', Download: 'ডাউনলোড', Share: 'শেয়ার', Delete: 'মুছুন', Search: 'খুঁজুন', More: 'আরও', 'Sign Out': 'সাইন আউট', 'Page not found': 'পৃষ্ঠা পাওয়া যায়নি', 'Access denied': 'প্রবেশাধিকার নেই' },
  mr: { Dashboard: 'डॅशबोर्ड', Requests: 'विनंत्या', Timetable: 'वेळापत्रक', Notifications: 'सूचना', Profile: 'प्रोफाइल', Settings: 'सेटिंग्ज', Save: 'जतन करा', Cancel: 'रद्द करा', Download: 'डाउनलोड', Share: 'सामायिक करा', Delete: 'हटवा', Search: 'शोधा', More: 'अधिक', 'Sign Out': 'साइन आउट', 'Page not found': 'पृष्ठ सापडले नाही', 'Access denied': 'प्रवेश नाकारला' },
  gu: { Dashboard: 'ડેશબોર્ડ', Requests: 'વિનંતીઓ', Timetable: 'સમયપત્રક', Notifications: 'સૂચનાઓ', Profile: 'પ્રોફાઇલ', Settings: 'સેટિંગ્સ', Save: 'સાચવો', Cancel: 'રદ કરો', Download: 'ડાઉનલોડ', Share: 'શેર કરો', Delete: 'કાઢી નાખો', Search: 'શોધો', More: 'વધુ', 'Sign Out': 'સાઇન આઉટ', 'Page not found': 'પૃષ્ઠ મળ્યું નથી', 'Access denied': 'પ્રવેશ નકાર્યો' },
  pa: { Dashboard: 'ਡੈਸ਼ਬੋਰਡ', Requests: 'ਬੇਨਤੀਆਂ', Timetable: 'ਸਮਾਂ-ਸਾਰਣੀ', Notifications: 'ਸੂਚਨਾਵਾਂ', Profile: 'ਪ੍ਰੋਫਾਈਲ', Settings: 'ਸੈਟਿੰਗਾਂ', Save: 'ਸੰਭਾਲੋ', Cancel: 'ਰੱਦ ਕਰੋ', Download: 'ਡਾਊਨਲੋਡ', Share: 'ਸਾਂਝਾ ਕਰੋ', Delete: 'ਮਿਟਾਓ', Search: 'ਖੋਜੋ', More: 'ਹੋਰ', 'Sign Out': 'ਸਾਈਨ ਆਉਟ', 'Page not found': 'ਪੰਨਾ ਨਹੀਂ ਮਿਲਿਆ', 'Access denied': 'ਪਹੁੰਚ ਅਸਵੀਕਾਰ' },
  ur: { Dashboard: 'ڈیش بورڈ', Requests: 'درخواستیں', Timetable: 'نظام الاوقات', Notifications: 'اطلاعات', Profile: 'پروفائل', Settings: 'ترتیبات', Save: 'محفوظ کریں', Cancel: 'منسوخ', Download: 'ڈاؤن لوڈ', Share: 'شیئر کریں', Delete: 'حذف کریں', Search: 'تلاش', More: 'مزید', 'Sign Out': 'سائن آؤٹ', 'Page not found': 'صفحہ نہیں ملا', 'Access denied': 'رسائی مسترد' },
  ar: { Dashboard: 'لوحة التحكم', Requests: 'الطلبات', Timetable: 'الجدول', Notifications: 'الإشعارات', Profile: 'الملف الشخصي', Settings: 'الإعدادات', Save: 'حفظ', Cancel: 'إلغاء', Download: 'تنزيل', Share: 'مشاركة', Delete: 'حذف', Search: 'بحث', More: 'المزيد', 'Sign Out': 'تسجيل الخروج', 'Page not found': 'الصفحة غير موجودة', 'Access denied': 'تم رفض الوصول' },
};

const englishCatalog: Record<string, string> = {
  'common.view': 'View', 'common.download': 'Download', 'common.print': 'Print', 'common.refresh': 'Refresh',
  'common.search': 'Search', 'common.clear': 'Clear', 'common.previous': 'Previous', 'common.next': 'Next',
  'common.loading': 'Loading...', 'common.available': 'Available', 'common.notAvailable': 'Not available',
  'common.records_one': '{{count}} record', 'common.records_other': '{{count}} records',
  'coe.hallTickets.title': 'Hall Tickets', 'coe.hallTickets.eyebrow': 'Examination operations',
  'coe.hallTickets.description': 'Search published student hall tickets and open the authoritative server-generated artifact.',
  'coe.hallTickets.searchPlaceholder': 'Search register number or student name',
  'coe.hallTickets.summaryAvailable': 'Available hall tickets', 'coe.hallTickets.summaryUnavailable': 'Not available yet',
  'coe.hallTickets.student': 'Student', 'coe.hallTickets.registerNumber': 'Register number',
  'coe.hallTickets.programme': 'Programme', 'coe.hallTickets.department': 'Department',
  'coe.hallTickets.semester': 'Semester', 'coe.hallTickets.section': 'Section', 'coe.hallTickets.exam': 'Exam',
  'coe.hallTickets.status': 'Status', 'coe.hallTickets.actions': 'Actions',
  'coe.hallTickets.emptyTitle': 'No hall tickets found',
  'coe.hallTickets.emptyBody': 'Try another register number or student name. Only published schedules and seat allocations are shown.',
  'coe.hallTickets.error': 'Hall tickets could not be loaded.', 'coe.hallTickets.downloadError': 'Hall ticket could not be downloaded.',
  'coe.hallTickets.subjects_one': '{{count}} subject', 'coe.hallTickets.subjects_other': '{{count}} subjects',
  'student.exams.title': 'Exam schedule and hall allotment', 'student.exams.eyebrow': 'My examinations',
  'student.exams.description': 'Only COE-published schedules and authorized seat allocations appear here.',
  'student.exams.emptyTitle': 'No published hall allotments',
  'student.exams.emptyBody': 'Your COE-published exam schedule and seat details will appear here.',
  'student.exams.errorTitle': 'Schedule unavailable', 'student.exams.error': 'Unable to load your examination schedule.',
  'student.exams.download': 'Download Hall Ticket', 'student.exams.openShare': 'Open or share Hall Ticket',
  'student.exams.seat': 'Seat', 'student.exams.datePending': 'Date pending', 'student.exams.examination': 'Examination',
  'student.exams.subject': 'Subject',
  'errors.notFound.title': 'Page not found',
  'errors.notFound.description': 'The page or record you are looking for does not exist or has been moved.',
  'errors.accessDenied.title': 'Access denied',
  'errors.accessDenied.description': 'You do not have permission to access this page. Contact your administrator if you believe this is an error.',
  'navigation.goBack': 'Go back',
  'navigation.goHome': 'Go home',
  'auth.email': 'Email address', 'auth.password': 'Password', 'auth.newPassword': 'New password', 'auth.confirmPassword': 'Confirm password',
  'auth.signIn': 'Sign in', 'auth.backToSignIn': 'Back to sign in', 'auth.forgotPassword': 'Forgot password?', 'auth.rememberMe': 'Remember me',
  'auth.reset.title': 'Reset password', 'auth.reset.description': 'Enter your registered email address and we will send password recovery instructions.',
  'auth.reset.send': 'Send recovery link', 'auth.reset.sentTitle': 'Reset link sent', 'auth.reset.sent': 'If the account exists, reset instructions will be sent.',
  'auth.reset.sendError': 'Could not send the reset link.', 'auth.emailInvalid': 'Enter a valid email address.',
  'auth.new.title': 'Set a new password', 'auth.new.description': 'Create a secure password for your campus account.',
  'auth.new.invalidTitle': 'Invalid link', 'auth.new.invalidBody': 'This link does not contain a valid recovery token. Request another reset link.',
  'auth.new.goRecovery': 'Go to password recovery', 'auth.new.requirements': 'Password strength requirements',
  'auth.new.minimum': 'Minimum 8 characters', 'auth.new.uppercase': 'At least one uppercase letter (A–Z)',
  'auth.new.lowercase': 'At least one lowercase letter (a–z)', 'auth.new.number': 'At least one number (0–9)',
  'auth.new.special': 'At least one special character (@$!%*?&)', 'auth.new.update': 'Update password',
  'auth.new.minimumError': 'Password must be at least 8 characters long.', 'auth.new.strengthError': 'Password must satisfy every strength requirement.',
  'auth.new.confirmError': 'Confirm your new password.', 'auth.new.matchError': 'Passwords do not match.',
  'auth.new.missingTokenTitle': 'Missing token', 'auth.new.missingToken': 'The recovery token is missing from the page URL.',
  'auth.new.successTitle': 'Password reset', 'auth.new.success': 'Your password was reset successfully. Redirecting to sign in...',
  'auth.new.failureTitle': 'Reset failed', 'auth.new.failure': 'The verification token is invalid or expired.',
  'common.error': 'Error',
  'auth.login.system': 'Institutional Academic & Campus Operating System',
  'auth.login.identifier': 'Email, username, or ID', 'auth.login.identifierPlaceholder': 'Enter email, username, or registration ID',
  'auth.login.identifierRequired': 'Email, username, or ID is required.', 'auth.login.passwordRequired': 'Password is required.',
  'auth.login.password': 'Password', 'auth.login.passwordPlaceholder': 'Enter your password',
  'auth.login.rememberMe': 'Remember me', 'auth.login.forgotPassword': 'Forgot password?',
  'auth.login.submit': 'Sign in', 'auth.login.signingIn': 'Signing in...',
  'auth.login.showPassword': 'Show password', 'auth.login.hidePassword': 'Hide password',
  'auth.login.sessionExpiredTitle': 'Session expired', 'auth.login.sessionExpired': 'Your session has expired. Sign in again.',
  'auth.login.failedTitle': 'Authentication failed', 'auth.login.failed': 'Check your email, username, ID, or password.',
  'auth.login.welcome': 'Welcome, {{name}}!', 'auth.login.loggedInAs': 'Signed in as {{role}}',
  'auth.login.privacy': 'Privacy policy', 'auth.login.terms': 'Terms of service',
  'auth.login.platformTitle': 'CampusOS institutional platform', 'auth.login.credit': 'CampusOS • Developed by Geetorus',
  'settings.title': 'Unified profile and system preferences', 'settings.description': 'Manage your account, security, language, appearance, and notifications.',
  'settings.account': 'Account', 'settings.privacy': 'Privacy', 'settings.security': 'Security', 'settings.password': 'Password',
  'settings.twoFactor.short': '2FA', 'settings.language': 'Language', 'settings.appearance': 'Appearance',
  'settings.notifications': 'Notifications', 'settings.devices': 'Devices', 'settings.helpTour': 'Help and tour',
  'settings.accountDetails': 'Personal account details', 'settings.firstName': 'First name', 'settings.lastName': 'Last name',
  'settings.phone': 'Phone number', 'settings.saveProfile': 'Save account profile',
  'settings.profile.updated': 'Account profile updated.', 'settings.profile.savedLocally': 'Profile preferences saved locally.',
  'settings.password.change': 'Change password', 'settings.password.current': 'Current password',
  'settings.password.updating': 'Updating...', 'settings.password.minimum': 'The new password must contain at least 6 characters.',
  'settings.password.changed': 'Password changed successfully.', 'settings.password.failed': 'Password update failed.',
  'settings.biometric.prompt': 'Enable CampusOS app lock', 'settings.biometric.enabled': 'Biometric app lock enabled.',
  'settings.biometric.disabled': 'Biometric app lock disabled.', 'settings.biometric.error': 'Biometrics could not be verified. App lock was not enabled.',
  'common.enabled': 'Enabled', 'common.disabled': 'Disabled',
  'settings.status': 'Status', 'settings.active': 'Active',
  'settings.twoFactor.title': 'Two-factor authentication (2FA)', 'settings.twoFactor.description': 'Add an extra layer of account security.',
  'settings.twoFactor.app': 'Authenticator app 2FA', 'settings.twoFactor.enable': 'Enable 2FA', 'settings.twoFactor.disable': 'Disable 2FA',
  'settings.twoFactor.enabled': 'Authenticator 2FA enabled.', 'settings.twoFactor.disabled': '2FA disabled.',
  'settings.theme.title': 'Theme and appearance', 'settings.theme.system': 'System (automatic)', 'settings.theme.light': 'Light mode',
  'settings.theme.dark': 'Dark mode', 'settings.theme.changed': 'Theme set to {{theme}}.',
  'settings.theme.systemDescription': 'Follows your device light or dark setting automatically.',
  'settings.theme.lightDescription': 'High-contrast light surfaces for daylight.', 'settings.theme.darkDescription': 'Dark surfaces for comfortable night use.',
};

const semanticCatalog: Partial<Record<LanguageCode, Record<string, string>>> = {
  ta: {
    'common.view': 'பார்', 'common.download': 'பதிவிறக்கு', 'common.print': 'அச்சிடு', 'common.refresh': 'புதுப்பி', 'common.search': 'தேடு', 'common.clear': 'அழி', 'common.previous': 'முந்தைய', 'common.next': 'அடுத்தது', 'common.loading': 'ஏற்றுகிறது...', 'common.available': 'கிடைக்கிறது', 'common.notAvailable': 'இன்னும் கிடைக்கவில்லை',
    'auth.login.identifier': 'மின்னஞ்சல், பயனர்பெயர், அல்லது அடையாள எண்', 'auth.login.password': 'கடவுச்சொல்', 'auth.login.rememberMe': 'என்னை நினைவில் கொள்', 'auth.login.forgotPassword': 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?', 'auth.login.submit': 'உள்நுழைக', 'auth.login.signingIn': 'உள்நுழைகிறது...',
    'coe.hallTickets.title': 'தேர்வறை அனுமதிச்சீட்டுகள்', 'coe.hallTickets.eyebrow': 'தேர்வு செயல்பாடுகள்', 'coe.hallTickets.description': 'வெளியிடப்பட்ட மாணவர் அனுமதிச்சீட்டுகளைத் தேடி, அதிகாரப்பூர்வ ஆவணத்தைத் திறக்கவும்.', 'coe.hallTickets.searchPlaceholder': 'பதிவு எண் அல்லது மாணவர் பெயரைத் தேடுங்கள்', 'coe.hallTickets.summaryAvailable': 'கிடைக்கும் அனுமதிச்சீட்டுகள்', 'coe.hallTickets.summaryUnavailable': 'இன்னும் கிடைக்கவில்லை', 'coe.hallTickets.student': 'மாணவர்', 'coe.hallTickets.registerNumber': 'பதிவு எண்', 'coe.hallTickets.programme': 'பாடத்திட்டம்', 'coe.hallTickets.department': 'துறை', 'coe.hallTickets.semester': 'பருவம்', 'coe.hallTickets.section': 'பிரிவு', 'coe.hallTickets.exam': 'தேர்வு', 'coe.hallTickets.status': 'நிலை', 'coe.hallTickets.actions': 'செயல்கள்', 'coe.hallTickets.emptyTitle': 'அனுமதிச்சீட்டுகள் இல்லை', 'coe.hallTickets.emptyBody': 'வேறு பதிவு எண் அல்லது பெயரை முயற்சிக்கவும். வெளியிடப்பட்ட தகவல்கள் மட்டும் காட்டப்படும்.', 'coe.hallTickets.error': 'அனுமதிச்சீட்டுகளை ஏற்ற முடியவில்லை.', 'coe.hallTickets.downloadError': 'அனுமதிச்சீட்டை பதிவிறக்க முடியவில்லை.',
    'student.exams.title': 'தேர்வு அட்டவணை மற்றும் அரங்க ஒதுக்கீடு', 'student.exams.eyebrow': 'என் தேர்வுகள்', 'student.exams.description': 'வெளியிடப்பட்ட அட்டவணை மற்றும் அங்கீகரிக்கப்பட்ட இருக்கை ஒதுக்கீடுகள் மட்டும் இங்கே தோன்றும்.', 'student.exams.emptyTitle': 'வெளியிடப்பட்ட அரங்க ஒதுக்கீடு இல்லை', 'student.exams.emptyBody': 'தேர்வு அட்டவணை மற்றும் இருக்கை விவரங்கள் வெளியிடப்பட்டதும் இங்கே தோன்றும்.', 'student.exams.errorTitle': 'அட்டவணை கிடைக்கவில்லை', 'student.exams.error': 'தேர்வு அட்டவணையை ஏற்ற முடியவில்லை.', 'student.exams.download': 'அனுமதிச்சீட்டை பதிவிறக்கு', 'student.exams.openShare': 'அனுமதிச்சீட்டைத் திற அல்லது பகிர்', 'student.exams.seat': 'இருக்கை', 'student.exams.datePending': 'தேதி நிலுவையில்', 'student.exams.examination': 'தேர்வு', 'student.exams.subject': 'பாடம்',
  },
  ar: {
    'common.view': 'عرض', 'common.download': 'تنزيل', 'common.print': 'طباعة', 'common.refresh': 'تحديث', 'common.search': 'بحث', 'common.clear': 'مسح', 'common.previous': 'السابق', 'common.next': 'التالي', 'common.loading': 'جار التحميل...', 'common.available': 'متاح', 'common.notAvailable': 'غير متاح',
    'auth.login.identifier': 'البريد الإلكتروني أو اسم المستخدم أو المعرف', 'auth.login.password': 'كلمة المرور', 'auth.login.rememberMe': 'تذكرني', 'auth.login.forgotPassword': 'هل نسيت كلمة المرور؟', 'auth.login.submit': 'تسجيل الدخول', 'auth.login.signingIn': 'جار تسجيل الدخول...',
    'coe.hallTickets.title': 'بطاقات دخول الامتحان', 'coe.hallTickets.eyebrow': 'عمليات الامتحانات', 'coe.hallTickets.description': 'ابحث عن بطاقات الطلاب المنشورة وافتح المستند الرسمي الصادر من الخادم.', 'coe.hallTickets.searchPlaceholder': 'ابحث برقم التسجيل أو اسم الطالب', 'coe.hallTickets.summaryAvailable': 'البطاقات المتاحة', 'coe.hallTickets.summaryUnavailable': 'غير متاحة بعد', 'coe.hallTickets.student': 'الطالب', 'coe.hallTickets.registerNumber': 'رقم التسجيل', 'coe.hallTickets.programme': 'البرنامج', 'coe.hallTickets.department': 'القسم', 'coe.hallTickets.semester': 'الفصل الدراسي', 'coe.hallTickets.section': 'الشعبة', 'coe.hallTickets.exam': 'الامتحان', 'coe.hallTickets.status': 'الحالة', 'coe.hallTickets.actions': 'الإجراءات', 'coe.hallTickets.emptyTitle': 'لم يتم العثور على بطاقات', 'coe.hallTickets.emptyBody': 'جرّب رقم تسجيل أو اسمًا آخر. تظهر الجداول وتخصيصات المقاعد المنشورة فقط.', 'coe.hallTickets.error': 'تعذر تحميل بطاقات الدخول.', 'coe.hallTickets.downloadError': 'تعذر تنزيل بطاقة الدخول.',
    'student.exams.title': 'جدول الامتحان وتخصيص القاعة', 'student.exams.eyebrow': 'امتحاناتي', 'student.exams.description': 'تظهر هنا الجداول المنشورة وتخصيصات المقاعد المصرح بها فقط.', 'student.exams.emptyTitle': 'لا توجد تخصيصات قاعة منشورة', 'student.exams.emptyBody': 'سيظهر جدول الامتحان وتفاصيل المقعد عند نشرها.', 'student.exams.errorTitle': 'الجدول غير متاح', 'student.exams.error': 'تعذر تحميل جدول الامتحان.', 'student.exams.download': 'تنزيل بطاقة الدخول', 'student.exams.openShare': 'فتح أو مشاركة بطاقة الدخول', 'student.exams.seat': 'المقعد', 'student.exams.datePending': 'التاريخ معلق', 'student.exams.examination': 'الامتحان', 'student.exams.subject': 'المادة',
  },
};
const legacySemanticAliases: Record<string, string> = { 'Hall Tickets': 'coe.hallTickets.title', View: 'common.view', Print: 'common.print', Refresh: 'common.refresh', Clear: 'common.clear', Previous: 'common.previous', Next: 'common.next' };

const STORAGE_KEY = 'campusos_language';
function initialLanguage(): LanguageCode {
  try { const value = localStorage.getItem(STORAGE_KEY) as LanguageCode | null; if (value && SUPPORTED_LANGUAGES.some((item) => item.code === value)) return value; } catch {}
  return 'en';
}

type TranslationValues = Record<string, string | number | null | undefined>;
interface LanguageContextValue { language: LanguageCode; direction: 'ltr' | 'rtl'; setLanguage: (code: LanguageCode) => void; t: (key: string, values?: TranslationValues) => string; formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string; formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string }
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);
  const direction: 'ltr' | 'rtl' = SUPPORTED_LANGUAGES.find((item) => item.code === language)?.rtl ? 'rtl' : 'ltr';
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dir = direction; document.body.dataset.direction = direction; }, [language, direction]);
  const setLanguage = useCallback((code: LanguageCode) => { localStorage.setItem(STORAGE_KEY, code); setLanguageState(code); }, []);
  const t = useCallback((key: string, values: TranslationValues = {}) => {
    key = legacySemanticAliases[key] || key;
    const count = typeof values.count === 'number' ? values.count : undefined;
    const pluralKey = count === undefined ? key : `${key}_${new Intl.PluralRules(language).select(count)}`;
    const template = semanticCatalog[language]?.[pluralKey] || semanticCatalog[language]?.[key] || englishCatalog[pluralKey] || englishCatalog[key] || common[language]?.[key] || common.en[key] || key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] == null ? '' : String(values[name]));
  }, [language]);
  const formatDate = useCallback((value: Date | string | number, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(language, { timeZone: 'Asia/Kolkata', ...options }).format(new Date(value)), [language]);
  const formatNumber = useCallback((value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(language, options).format(value), [language]);
  const value = useMemo(() => ({ language, direction, setLanguage, t, formatDate, formatNumber }), [language, direction, setLanguage, t, formatDate, formatNumber]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => { const context = useContext(LanguageContext); if (!context) throw new Error('useLanguage must be used within LanguageProvider'); return context; };
