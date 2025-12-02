'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add is_public column
    await queryInterface.addColumn('exams', 'is_public', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true, // Default to public
    });

    // Update existing records to be public by default
    await queryInterface.sequelize.query(
      `UPDATE exams SET is_public = true WHERE is_public IS NULL`
    );

    // Set default value for duration if not set
    await queryInterface.changeColumn('exams', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 30, // Default 30 minutes
    });

    // Update existing records that have null duration to 30
    await queryInterface.sequelize.query(
      `UPDATE exams SET duration = 30 WHERE duration IS NULL`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove is_public column
    await queryInterface.removeColumn('exams', 'is_public');

    // Revert duration default (remove default, keep allowNull: true)
    await queryInterface.changeColumn('exams', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};

