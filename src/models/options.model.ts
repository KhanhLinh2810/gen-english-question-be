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

export class Options extends Model<
  InferAttributes<Options>,
  InferCreationAttributes<Options>
> {
  declare id: CreationOptional<number>;
  declare questionId: ForeignKey<Questions['id']>;
  declare content: string;
  declare explanation: string | null;
  declare isCorrect: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  static initClass = (sequelize: Sequelize) => {
    Options.init(
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
        isCorrect: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'options',
        timestamps: true,
        underscored: true,
      },
    );
  };

  static associate = () => {
    Options.belongsTo(Questions, {
      foreignKey: 'questionId',
      as: 'question',
    });
  };
}
