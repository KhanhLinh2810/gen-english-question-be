'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('exam_attempts', {
			id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			exam_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: 'exams',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			started_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			finished_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			duration: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			total_question: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			correct_question: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			wrong_question: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			score: {
				type: Sequelize.FLOAT,
				allowNull: true,
			},
			list_answer: {
				type: Sequelize.JSON,
				allowNull: true,
				defaultValue: [],
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},

			deleted_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('exam_attempts');
	},
};
