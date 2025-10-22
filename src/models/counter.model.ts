import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';

export class Counter extends Model<
  InferAttributes<Counter>,
  InferCreationAttributes<Counter>
> {
  declare sequenceName: string;
  declare value: number;

  static initClass = (sequelize: Sequelize) => {
    Counter.init(
      {
        sequenceName: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
        value: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: 'counters',
        timestamps: false,
        underscored: true,
        name: {
          singular: 'counter',
          plural: 'counters',
        },
      },
    );
  };
}
