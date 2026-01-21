const handlebars = require('handlebars');

// Bengali months (short form as shown in PDF)
const BENGALI_MONTHS_SHORT = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন',
  'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
];

// Bengali months (full form)
const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

// Bengali digits
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Format number with comma separators
handlebars.registerHelper('formatNumber', function(number) {
  if (number === null || number === undefined) return '0.00';
  return parseFloat(number).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

// Format date
handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB');
});

// Format bill month (YYYY-MM to Month Year)
handlebars.registerHelper('formatBillMonth', function(billMonth) {
  if (!billMonth) return '';
  const [year, month] = billMonth.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
});

// Convert to Bengali digits
handlebars.registerHelper('toBengaliDigits', function(number) {
  if (number === null || number === undefined) return '';
  return number.toString().split('').map(char => {
    if (char >= '0' && char <= '9') {
      return BENGALI_DIGITS[parseInt(char)];
    }
    return char; // Keep decimal points, commas, etc.
  }).join('');
});

// Format month name in Bengali (short form - as shown in PDF)
handlebars.registerHelper('formatMonthBengaliShort', function(dateString) {
  const date = new Date(dateString);
  return BENGALI_MONTHS_SHORT[date.getMonth()];
});

// Format year in Bengali
handlebars.registerHelper('formatYearBengali', function(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear().toString();
  return year.split('').map(digit => BENGALI_DIGITS[parseInt(digit)]).join('');
});

// Format number with thousand separators and Bengali digits
handlebars.registerHelper('formatBengaliNumber', function(number) {
  if (number === null || number === undefined) return '০';
  
  // Format with commas
  const formatted = number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Convert to Bengali digits
  return formatted.split('').map(char => {
    if (char >= '0' && char <= '9') {
      return BENGALI_DIGITS[parseInt(char)];
    }
    return char;
  }).join('');
});

// Format date range for title (e.g., "জুন থেকে নভেম্বর, ২০২৫")
handlebars.registerHelper('formatDateRange', function(bills) {
  if (!bills || bills.length === 0) return '';
  
  const firstMonth = new Date(bills[0].billMonth);
  const lastMonth = new Date(bills[bills.length - 1].billMonth);
  
  const firstMonthBengali = BENGALI_MONTHS[firstMonth.getMonth()];
  const lastMonthBengali = BENGALI_MONTHS[lastMonth.getMonth()];
  const year = lastMonth.getFullYear().toString().split('').map(d => BENGALI_DIGITS[parseInt(d)]).join('');
  
  return `${firstMonthBengali} থেকে ${lastMonthBengali}, ${year}`;
});

// Compare helper
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Greater than helper
handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

// Addition helper
handlebars.registerHelper('add', function(a, b) {
  return parseFloat(a) + parseFloat(b);
});

// Subtraction helper
handlebars.registerHelper('subtract', function(a, b) {
  return parseFloat(a) - parseFloat(b);
});

module.exports = handlebars;
