var markets = [
  {
    id: 'amazon',
    urlRegex: /^https?:\/\/www\.amazon\.com/,
    humanReadable: 'Amazon.com',
    coinboughtDomain: 'us.coinbought.com',
  },
  {
    id: 'amazon_uk',
    urlRegex: /^https?:\/\/www\.amazon\.co\.uk/,
    humanReadable: 'Amazon.co.uk',
    coinboughtDomain: 'uk.coinbought.com',
  },
  {
    id: 'amazon_de',
    urlRegex: /^https?:\/\/www\.amazon\.de/,
    humanReadable: 'Amazon.de',
    coinboughtDomain: 'de.coinbought.com',
  },
];
module.exports.markets = markets;

