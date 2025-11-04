import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  SaveOptions,
  Sequelize,
} from 'sequelize';

export class Users extends Model<
  InferAttributes<Users>,
  InferCreationAttributes<Users, { omit: 'created_at' | 'updated_at' }>
> {
  declare id: CreationOptional<number>;
  declare avatar_url?: string | null;
  declare username: string;
  declare email: string;
  declare password: string;
  declare created_at: Date;
  declare updated_at: Date;
  // declare deleted_at: CreationOptional<Date>;

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
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        // deleted_at: {
        //   type: DataTypes.DATE,
        //   allowNull: true,
        //   defaultValue: null,
        // },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        // paranoid: true,
        underscored: true,
        // created_at: 'created_at',
        // updated_at: 'updated_at',
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
