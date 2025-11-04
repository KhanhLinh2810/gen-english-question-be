module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
  async down (queryInterface, Sequelize) {
    // Optionally recreate table if you rollback
  }
};
