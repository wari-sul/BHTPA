const handlebars = require('handlebars');

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
