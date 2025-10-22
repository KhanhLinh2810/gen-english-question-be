import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';

export class Users extends Model<
  InferAttributes<Users>,
  InferCreationAttributes<Users, { omit: 'createdAt' | 'updatedAt' }>
> {
  declare id: CreationOptional<number>;
  declare avatar_url?: string | null;
  declare username: string;
  declare email: string;
  declare password: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: CreationOptional<Date>;

  // Associations

  static initClass = (sequelize: Sequelize) => {
    Users.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        avatar_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        username: {
          type: DataTypes.STRING(100),
          unique: true,
        },
        email: {
          type: DataTypes.STRING,
          unique: true,
        },
        password: DataTypes.TEXT,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        name: {
          singular: 'user',
          plural: 'users',
        },
        defaultScope: {
          attributes: { exclude: ['password'] },
        },
      },
    );
  };

  toJSON() {
    const attributes = Object.assign({}, this.get());
    // @ts-ignore
    delete attributes.password;
    return attributes;
  }
}
