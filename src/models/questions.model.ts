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
import { Options } from './options.model';

interface QuestionsCreationAttributes extends Optional<InferCreationAttributes<Questions>, 'id'> {
  options?: CreationAttributes<Options>[]; 
}


export class Questions extends Model<InferAttributes<Questions>, QuestionsCreationAttributes>{
  declare id: CreationOptional<number>;
  declare content: string;
  declare description?: string | null;
  declare score: number;
  declare tags?: string | null;
  declare creatorId: ForeignKey<Users['id']>;
  declare createdAt: Date;
  declare updatedAt: Date;

  // 🧩 Các trường association được khai báo thêm:
  declare creator?: NonAttribute<Users>;
  declare options?: NonAttribute<Options[]>;

  static associations: {
    creator: Association<Questions, Users>;
    options: Association<Questions, Options>;
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
        creatorId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'questions',
        timestamps: true,
        underscored: true,
      },
    );
  };

  static associate = () => {
    Questions.belongsTo(Users, {
      foreignKey: 'creatorId',
      as: 'creator',
    });

    Questions.hasMany(Options, {
      foreignKey: 'questionId',
      as: 'options',
    });
  };
}
