import {defineField, defineType} from 'sanity';

export const claimRecordType = defineType({
  name: 'claimRecord',
  title: 'Libro de Reclamaciones',
  type: 'document',
  fields: [
    defineField({
      name: 'claimType',
      title: 'Tipo de solicitud',
      type: 'string',
      options: {
        list: [
          {title: 'Reclamo', value: 'reclamo'},
          {title: 'Queja', value: 'queja'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'submittedAt', title: 'Fecha y hora de envío', type: 'datetime', validation: (rule) => rule.required()}),
    defineField({name: 'consumerName', title: 'Nombres y apellidos', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'documentType',
      title: 'Tipo de documento',
      type: 'string',
      options: {
        list: [
          {title: 'DNI', value: 'dni'},
          {title: 'Carné de extranjería', value: 'ce'},
          {title: 'Pasaporte', value: 'pasaporte'},
          {title: 'Otro', value: 'otro'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'documentNumber', title: 'Número de documento', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'department', title: 'Departamento', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'province', title: 'Provincia', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'district', title: 'Distrito', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'address', title: 'Dirección', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'phone', title: 'Teléfono', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'email', title: 'Correo electrónico', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'productService', title: 'Bien a reclamar', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'contractedGoodDescription',
      title: 'Descripción del bien contratado',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'amount', title: 'Monto reclamado', type: 'string'}),
    defineField({name: 'purchaseChannel', title: 'Canal de compra', type: 'string'}),
    defineField({name: 'orderNumber', title: 'Número de pedido o comprobante', type: 'string'}),
    defineField({
      name: 'detail',
      title: 'Detalle de la reclamación o queja',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'request',
      title: 'Pedido del consumidor',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'isMinor', title: 'Es menor de edad', type: 'boolean', initialValue: false}),
    defineField({name: 'guardianName', title: 'Nombre del padre, madre o representante', type: 'string'}),
    defineField({name: 'guardianDocument', title: 'Documento del representante', type: 'string'}),
    defineField({name: 'guardianPhone', title: 'Teléfono del representante', type: 'string'}),
    defineField({name: 'guardianEmail', title: 'Correo del representante', type: 'string'}),
    defineField({
      name: 'status',
      title: 'Estado',
      type: 'string',
      initialValue: 'recibido',
      options: {
        list: [
          {title: 'Recibido', value: 'recibido'},
          {title: 'En revisión', value: 'en_revision'},
          {title: 'Respondido', value: 'respondido'},
          {title: 'Cerrado', value: 'cerrado'},
        ],
      },
    }),
    defineField({name: 'response', title: 'Respuesta de la empresa', type: 'text', rows: 5}),
  ],
  preview: {
    select: {
      title: 'consumerName',
      subtitle: 'claimType',
      date: 'submittedAt',
    },
    prepare(selection) {
      const label = selection.subtitle === 'queja' ? 'Queja' : 'Reclamo';
      return {
        title: selection.title || 'Reclamo sin nombre',
        subtitle: `${label}${selection.date ? ` · ${selection.date}` : ''}`,
      };
    },
  },
});
