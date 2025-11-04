import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';

export class File extends Model<
  InferAttributes<File>,
  InferCreationAttributes<File>
> {
  declare id: CreationOptional<number>;
  declare entityType: string;
  declare entityId: number;
  declare fileType: string;
  declare fileUrl: string;
  declare fileName?: string | null;
  declare fileSize?: number | null;
  declare mimeType?: string | null;
  declare displayOrder: CreationOptional<number>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;

  static initClass = (sequelize: Sequelize) => {
    File.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        entityType: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: 'entity_type',
        },
        entityId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'entity_id',
        },
        fileType: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: 'file_type',
        },
        fileUrl: {
          type: DataTypes.STRING(512),
          allowNull: false,
          field: 'file_url',
        },
        fileName: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'file_name',
        },
        fileSize: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'file_size',
        },
        mimeType: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'mime_type',
        },
        displayOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'display_order',
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at',
        },
      },
      {
        sequelize,
        tableName: 'files',
        underscored: true,
        paranoid: true,
        name: {
          singular: 'file',
          plural: 'files',
        },
      },
    );
  };
}
