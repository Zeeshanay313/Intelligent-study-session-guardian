// Quick environment validation script
require('dotenv').config();

console.log('=== Environment Validation ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

console.log('\n=== Google OAuth Configuration ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 4)}...` : 'NOT SET');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

console.log('\n=== Issues Found ===');
const issues = [];

if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('your-')) {
  issues.push('❌ GOOGLE_CLIENT_ID is not set or still contains placeholder value');
}

if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET.includes('your-')) {
  issues.push('❌ GOOGLE_CLIENT_SECRET is not set or still contains placeholder value');
}

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('your-')) {
  issues.push('⚠️  SESSION_SECRET is not set or still contains placeholder value');
}

if (issues.length === 0) {
  console.log('✅ All Google OAuth environment variables are properly configured!');
} else {
  issues.forEach(issue => console.log(issue));
  console.log('\n📝 To fix: Update your .env file with actual values from Google Console');
}