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
import { IQuestionInExam } from '../interfaces';
import { Users } from './users.model';

export interface ExamsCreationAttributes
  extends Optional<
    InferCreationAttributes<Exams>,
    'id' | 'created_at' | 'updated_at'
  > {
  list_question: IQuestionInExam[];
}
export class Exams extends Model<
  InferAttributes<Exams>,
  ExamsCreationAttributes
> {
  declare id: CreationOptional<number>;
  declare creator_id?: number | null;
  declare title: string;
  declare duration: number;
  declare total_question: number;
  declare earliest_start_time: Date;
  declare lastest_start_time?: Date | null;
  declare max_attempt?: number | null;
  declare note: string;
  declare list_question: IQuestionInExam[];
  declare is_public?: boolean | null;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  //associate
  declare creator?: NonAttribute<Users>;

  static associate = () => {
    Exams.belongsTo(Users, {
      foreignKey: 'creator_id',
      as: 'creator',
      onDelete: 'SET NULL',
    });
  };

  static initClass = (sequelize: Sequelize) => {
    Exams.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        creator_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        duration: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 30, // Default 30 minutes
        },
        total_question: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        earliest_start_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        lastest_start_time: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        max_attempt: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        note: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        list_question: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [],
        },
        is_public: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true, // Default to public
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
        tableName: 'exams',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      },
    );
  };
}
