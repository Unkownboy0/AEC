# CampusOS — Internationalization (i18n) & UI Regression Report

**Date**: August 20, 2026  
**Scope**: Language Context (`LanguageContext.tsx`), Login Screen (`Login.tsx`), Settings (`Settings.tsx`), and Multilingual Catalogs.

---

## 1. Audit Findings: Missing Keys & Fallback Failures

During the initial pass, several critical authentication UI elements were using raw key strings or incomplete catalog paths:
- `auth.login.password`
- `auth.login.rememberMe`
- `auth.login.forgotPassword`
- `auth.login.submit`
- `auth.login.signingIn`
- `auth.login.passwordPlaceholder`

When rendered, the application showed the raw dotted string instead of human-readable text.

---

## 2. Implemented Translations & Fallback Schema

In `product/client/src/context/LanguageContext.tsx`:

### 2.1 English (`defaultTranslations`)
```ts
'auth.login.system': 'Institutional Academic & Campus Operating System',
'auth.login.identifier': 'Email, username, or ID',
'auth.login.identifierPlaceholder': 'Enter email, username, or registration ID',
'auth.login.identifierRequired': 'Email, username, or ID is required.',
'auth.login.passwordRequired': 'Password is required.',
'auth.login.password': 'Password',
'auth.login.passwordPlaceholder': 'Enter your password',
'auth.login.rememberMe': 'Remember me',
'auth.login.forgotPassword': 'Forgot password?',
'auth.login.submit': 'Sign in',
'auth.login.signingIn': 'Signing in...',
'auth.login.privacy': 'Privacy policy',
'auth.login.terms': 'Terms of service',
'auth.login.credit': 'CampusOS • Developed by Geetorus',
```

### 2.2 Tamil (`ta`)
```ts
'auth.login.identifier': 'மின்னஞ்சல், பயனர்பெயர், அல்லது அடையாள எண்',
'auth.login.password': 'கடவுச்சொல்',
'auth.login.rememberMe': 'என்னை நினைவில் கொள்',
'auth.login.forgotPassword': 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?',
'auth.login.submit': 'உள்நுழைக',
'auth.login.signingIn': 'உள்நுழைகிறது...',
```

### 2.3 Arabic (`ar`)
```ts
'auth.login.identifier': 'البريد الإلكتروني أو اسم المستخدم أو المعرف',
'auth.login.password': 'كلمة المرور',
'auth.login.rememberMe': 'تذكرني',
'auth.login.forgotPassword': 'هل نسيت كلمة المرور؟',
'auth.login.submit': 'تسجيل الدخول',
'auth.login.signingIn': 'جار تسجيل الدخول...',
```

---

## 3. Regression Test Results

1. **Zero Raw Keys on Login**: Inspected all label, input placeholder, and button states; verified 0 unmapped dotted keys.
2. **Language Switch Persistence**: Switching between English, Tamil, and Arabic in settings or login dynamically translates all auth strings.
3. **Graceful Fallback**: Any missing regional key seamlessly falls back to the English default dictionary.
