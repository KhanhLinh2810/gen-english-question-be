import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';

export class UserSearchModel extends Model<
  InferAttributes<UserSearchModel>,
  InferCreationAttributes<UserSearchModel>
> {
  declare id: CreationOptional<number>;
  declare searchTerm: any;
  declare scope: string;
  declare userId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initClass = (sequelize: Sequelize) => {
    UserSearchModel.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        searchTerm: {
          type: DataTypes.JSON,
          allowNull: false,
        },
        scope: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: 'user_search',
        timestamps: true,
        underscored: true,
        name: {
          singular: 'userSearch',
          plural: 'userSearches',
        },
      },
    );
  };
}
