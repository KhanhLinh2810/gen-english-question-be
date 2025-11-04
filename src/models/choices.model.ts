import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  ForeignKey,
} from 'sequelize';
import { Questions } from './questions.model';

export class Choices extends Model<
  InferAttributes<Choices>,
  InferCreationAttributes<Choices>
> {
  declare id: CreationOptional<number>;
  declare questionId: ForeignKey<Questions['id']>;
  declare content: string;
  declare explanation: string | null;
  declare is_correct: boolean;
  declare created_at: Date;
  declare updated_at: Date;

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
          references: {
            model: 'questions',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        explanation: {
          type: DataTypes.STRING,
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
        underscored: true,
      },
    );
  };

  static associate = () => {
    Choices.belongsTo(Questions, {
      foreignKey: 'questionId',
      as: 'question',
    });
  };
}
