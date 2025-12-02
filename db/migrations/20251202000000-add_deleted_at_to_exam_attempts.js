'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const [results] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'exam_attempts' 
       AND COLUMN_NAME = 'deleted_at'`
    );

    // Only add column if it doesn't exist
    if (results.length === 0) {
      await queryInterface.addColumn('exam_attempts', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('exam_attempts', 'deleted_at');
  },
};

