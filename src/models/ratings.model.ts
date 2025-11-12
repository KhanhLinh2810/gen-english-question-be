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

export class Ratings extends Model<
  InferAttributes<Ratings>,
  InferCreationAttributes<Ratings>
> {
  declare question_id: ForeignKey<Questions['id']>;
  declare user_id: ForeignKey<Users['id']>;
  declare rating_value: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare user?: Users | null;

  // Associations
  static associate() {
    Ratings.belongsTo(Questions, {
      foreignKey: 'question_id', 
      as: 'question',
      onDelete: 'CASCADE',
    });

    Ratings.belongsTo(Users, {
      foreignKey: 'user_id', 
      as: 'user',
      onDelete: 'CASCADE',
    });
  }

  static initClass(sequelize: Sequelize) {
    Ratings.init(
      {
        question_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        rating_value: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 5,
          },
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'ratings',
        createdAt: "created_at",
        updatedAt: "updated_at",
        timestamps: true,
        underscored: true,
      },
    );
  }
}
