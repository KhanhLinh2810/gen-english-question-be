import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';
import { Questions } from './questions.model';

export class Choices extends Model<
  InferAttributes<Choices>,
  InferCreationAttributes<Choices>
> {
  declare id: CreationOptional<number>;
  declare questionId: ForeignKey<Questions['id']>;
  declare content: string;
  declare explanation: string;
  declare is_correct: boolean;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  static associate = () => {
    Choices.belongsTo(Questions, {
      foreignKey: 'questionId',
      as: 'question',
      onDelete: 'CASCADE',
    });
  };

  static initClass = (sequelize: Sequelize) => {
    Choices.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        questionId: {
          type: DataTypes.INTEGER,
        },
        content: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        explanation: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        is_correct: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'choices',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      },
    );
  };
}
