import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  ForeignKey,
  NonAttribute,
  Association,
  Optional,
  CreationAttributes,
} from 'sequelize';
import { Users } from './users.model';
import { Choices } from './choices.model';

interface QuestionsCreationAttributes extends Optional<InferCreationAttributes<Questions>, 'id'> {
  choices?: CreationAttributes<Choices>[]; 
}


export class Questions extends Model<InferAttributes<Questions>, QuestionsCreationAttributes>{
  declare id: CreationOptional<number>;
  declare content: string;
  declare description?: string | null;
  declare score: number;
  declare tags?: string | null;
  declare creator_id: ForeignKey<Users['id']>;
  declare created_at: Date;
  declare updated_at: Date;

  // 🧩 Các trường association được khai báo thêm:
  declare creator?: NonAttribute<Users>;
  declare choices?: NonAttribute<Choices[]>;

  static associations: {
    creator: Association<Questions, Users>;
    choices: Association<Questions, Choices>;
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
          defaultValue: 0,
        },
        tags: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        creator_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'questions',
        timestamps: true,
        underscored: true,
      },
    );
  };
}
