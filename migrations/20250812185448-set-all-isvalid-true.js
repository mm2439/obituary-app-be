'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkUpdate('refreshTokens', 
      { isValid: true }, 
      {}
    );
  },

  async down (queryInterface, Sequelize) {
    // Optional: revert them back to false (not always needed)
    await queryInterface.bulkUpdate('refreshTokens', 
      { isValid: false }, 
      {}
    );
  }
};
