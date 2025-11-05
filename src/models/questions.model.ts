import {
  Association,
  CreationAttributes,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Optional,
  Sequelize,
} from 'sequelize';
import { Choices } from './choices.model';
import { Users } from './users.model';
import { QuestionType } from '../enums';

interface QuestionsCreationAttributes
  extends Optional<InferCreationAttributes<Questions>, 'id'> {
  choices: CreationAttributes<Choices>[];
}

export class Questions extends Model<
  InferAttributes<Questions>,
  QuestionsCreationAttributes
> {
  declare id: CreationOptional<number>;
  declare content: string;
  declare description: string;
  declare score: number;
  declare type: QuestionType;
  declare tags?: string | null;
  declare creator_id?: number | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare creator?: NonAttribute<Users>;
  declare choices: NonAttribute<Choices[]>;

  static associate = () => {
    Questions.hasMany(Choices, {
      foreignKey: 'question_id',
      as: 'choices',
    });

    Questions.belongsTo(Users, {
      foreignKey: 'creator_id',
      as: 'creator',
      onDelete: 'SET NULL',
    });
  };

  static initClass = (sequelize: Sequelize) => {
    Questions.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        score: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        tags: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        creator_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'questions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      },
    );
  };
}
