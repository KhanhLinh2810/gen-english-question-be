import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Optional,
  Sequelize,
} from 'sequelize';
import { Users } from './users.model';
import { Exams } from './exams.model';
import { IAnswerInExamAttempt } from '../interfaces';

interface ExamAttemptsCreationAttributes
  extends Optional<
    InferCreationAttributes<ExamAttempts>,
    | 'id'
    | 'finished_at'
    | 'total_question'
    | 'correct_question'
    | 'wrong_question'
    | 'score'
    | 'list_answer'
  > {}

export class ExamAttempts extends Model<
  InferAttributes<ExamAttempts>,
  ExamAttemptsCreationAttributes
> {
  declare id: CreationOptional<number>;
  declare exam_id: number;
  declare user_id: number;
  declare started_at: Date;
  declare finished_at?: Date | null;
  declare duration: number;
  declare total_question?: number | null;
  declare correct_question?: number | null;
  declare wrong_question?: number | null;
  declare score?: number | null;
  declare list_answer: IAnswerInExamAttempt[];
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations
  declare exam?: NonAttribute<Exams>;
  declare user?: NonAttribute<Users>;

  static associate = () => {
    ExamAttempts.belongsTo(Exams, {
      foreignKey: 'exam_id',
      as: 'exam',
      onDelete: 'CASCADE',
    });

    ExamAttempts.belongsTo(Users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  static initClass = (sequelize: Sequelize) => {
    ExamAttempts.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        exam_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        started_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        finished_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        duration: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: 'Thời gian làm bài (phút)',
        },
        total_question: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        correct_question: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        wrong_question: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        score: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        list_answer: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [],
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'exam_attempts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      },
    );
  };
}
