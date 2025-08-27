'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the table if it exists
    await queryInterface.dropTable('refreshTokens');

    // Create the table
    await queryInterface.createTable('refreshTokens', {
      id: {
        type: Sequelize.INTEGER, // matches users.id type
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER, // matches users.id exactly
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token: {
        type: Sequelize.STRING(512), // long enough for JWT, but still VARCHAR
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isValid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Composite unique index — must set length for token in MySQL
    await queryInterface.addIndex(
      'refreshTokens',
      ['userId', { attribute: 'token', length: 191 }],
      {
        unique: true,
        name: 'unique_user_token'
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refreshTokens');
  }
};
