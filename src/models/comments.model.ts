import {
  Association,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';
import { Questions } from './questions.model';
import { Users } from './users.model';

export class Comments extends Model<
  InferAttributes<Comments>,
  InferCreationAttributes<Comments>
> {
  declare id: CreationOptional<number>;
  declare question_id: ForeignKey<Questions['id']>;
  declare user_id: ForeignKey<Users['id']>;
  declare content: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare user?: Users | null;

  // Associations
  static associate() {
    Comments.belongsTo(Questions, {
      foreignKey: 'question_id',
      as: 'question',
      onDelete: 'CASCADE',
    });

    Comments.belongsTo(Users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'SET NULL',
    });
  }

  static initClass(sequelize: Sequelize) {
    Comments.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        question_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'comments',
        timestamps: true,
        underscored: true,
      },
    );
  }
}
