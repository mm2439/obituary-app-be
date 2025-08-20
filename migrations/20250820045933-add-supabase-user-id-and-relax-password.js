"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable("users");

        // 1) Add supabase_user_id (allowNull: true for safe rollout; model enforces not-null for new writes)
        if (!table.supabase_user_id) {
            await queryInterface.addColumn("users", "supabase_user_id", {
                type: Sequelize.STRING,
                allowNull: true,     // keep true for existing rows; new inserts set it via code
                unique: true,
            });
        }

        // 2) Make password nullable (we no longer use it)
        if (table.password && table.password.allowNull === false) {
            await queryInterface.changeColumn("users", "password", {
                type: Sequelize.TEXT,
                allowNull: true,
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable("users");

        // revert password to NOT NULL
        if (table.password && table.password.allowNull === true) {
            await queryInterface.changeColumn("users", "password", {
                type: Sequelize.TEXT,
                allowNull: false,
            });
        }

        // remove supabase_user_id
        if (table.supabase_user_id) {
            await queryInterface.removeColumn("users", "supabase_user_id");
        }
    },
};
