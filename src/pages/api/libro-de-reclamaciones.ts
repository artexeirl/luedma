import type {APIRoute} from 'astro';
import nodemailer from 'nodemailer';
import {siteSettings} from '../../data/snapshot';
import {hasSanityWriteConfig, sanityAdminClient} from '../../lib/sanity.admin';
import {getServerEnv} from '../../lib/server-env';

type ClaimType = 'reclamo' | 'queja';

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isClaimType(value: string): value is ClaimType {
  return value === 'reclamo' || value === 'queja';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPeruDate(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(value);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return `${get('day')}/${get('month')}/${get('year')} - ${get('hour')}:${get('minute')}`;
}

async function generateClaimId(submittedAt: Date): Promise<string> {
  const year = submittedAt.getUTCFullYear();
  const buildCandidate = () => `ML-${year}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

  if (hasSanityWriteConfig) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = buildCandidate();
      const exists = await sanityAdminClient.fetch<number>('count(*[_type == "claimRecord" && _id == $id])', {id: candidate});
      if (exists === 0) return candidate;
    }
  }

  return buildCandidate();
}

function row(label: string, value: string): string {
  return `<tr><th style="text-align:left;padding:8px 10px;border:1px solid #e2e2e2;background:#fafafa;">${escapeHtml(label)}</th><td style="padding:8px 10px;border:1px solid #e2e2e2;">${escapeHtml(value || '-')}</td></tr>`;
}

function buildEmailHtml(data: Record<string, string>, claimId: string): string {
  const claimLabel = data.claimType === 'queja' ? 'Queja' : 'Reclamo';
  const logoSrc = siteSettings.logo.startsWith('http') ? siteSettings.logo : `${siteSettings.siteUrl}${siteSettings.logo}`;

  return `<!doctype html>
  <html lang="es">
    <body style="font-family:Arial,sans-serif;color:#1f1f1f;line-height:1.6;background:#f7f7f7;margin:0;padding:24px 0;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;padding:24px;">
        <img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(siteSettings.siteName)}" style="display:block;width:220px;max-width:100%;height:auto;margin:0 0 24px;" />
        <h1 style="margin:0 0 10px;font-size:24px;">Libro de Reclamaciones</h1>
        <p style="margin:0 0 8px;">Esta constancia acredita el registro de un ${claimLabel.toLowerCase()} ingresado a través del Libro de Reclamaciones de ${escapeHtml(siteSettings.siteName)}.</p>
        <p style="margin:0 0 18px;">Código de reclamo: <strong>${escapeHtml(claimId)}</strong></p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e2e2;">
          <tbody>
            ${row('Código', claimId)}
            ${row('Tipo', claimLabel)}
            ${row('Fecha de envío', data.submittedAt)}
            ${row('Nombres y apellidos', data.consumerName)}
            ${row('Tipo de documento', data.documentType)}
            ${row('Número de documento', data.documentNumber)}
            ${row('Departamento', data.department)}
            ${row('Provincia', data.province)}
            ${row('Distrito', data.district)}
            ${row('Dirección', data.address)}
            ${row('Teléfono', data.phone)}
            ${row('Correo', data.email)}
            ${row('Bien a reclamar', data.productService)}
            ${row('Descripción del bien contratado', data.contractedGoodDescription)}
            ${row('Monto', data.amount)}
            ${row('Canal de compra', data.purchaseChannel)}
            ${row('Número de pedido o comprobante', data.orderNumber)}
            ${row('Detalle', data.detail)}
            ${row('Pedido', data.request)}
            ${row('Menor de edad', data.isMinor)}
            ${row('Representante', data.guardianName)}
            ${row('Doc. representante', data.guardianDocument)}
            ${row('Tel. representante', data.guardianPhone)}
            ${row('Correo representante', data.guardianEmail)}
          </tbody>
        </table>
      </div>
    </body>
  </html>`;
}

export const POST: APIRoute = async ({request}) => {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const claimType = normalizeText(payload.claimType);
    const consumerName = normalizeText(payload.consumerName);
    const documentType = normalizeText(payload.documentType);
    const documentNumber = normalizeText(payload.documentNumber);
    const department = normalizeText(payload.department);
    const province = normalizeText(payload.province);
    const district = normalizeText(payload.district);
    const address = normalizeText(payload.address);
    const phone = normalizeText(payload.phone);
    const email = normalizeText(payload.email);
    const productService = normalizeText(payload.productService);
    const contractedGoodDescription = normalizeText(payload.contractedGoodDescription);
    const amount = normalizeText(payload.amount);
    const purchaseChannel = normalizeText(payload.purchaseChannel);
    const orderNumber = normalizeText(payload.orderNumber);
    const detail = normalizeText(payload.detail);
    const requestDetail = normalizeText(payload.request);
    const isMinor = Boolean(payload.isMinor);
    const guardianName = normalizeText(payload.guardianName);
    const guardianDocument = normalizeText(payload.guardianDocument);
    const guardianPhone = normalizeText(payload.guardianPhone);
    const guardianEmail = normalizeText(payload.guardianEmail);

    if (!isClaimType(claimType)) {
      return new Response(JSON.stringify({error: 'Selecciona si deseas registrar un reclamo o una queja.'}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      });
    }

    const requiredFields = [
      consumerName,
      documentType,
      documentNumber,
      department,
      province,
      district,
      address,
      phone,
      email,
      productService,
      contractedGoodDescription,
      detail,
      requestDetail,
    ];

    if (requiredFields.some((value) => !value)) {
      return new Response(JSON.stringify({error: 'Completa todos los campos obligatorios.'}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      });
    }

    if (isMinor && (!guardianName || !guardianDocument || !guardianPhone || !guardianEmail)) {
      return new Response(
        JSON.stringify({error: 'Si el consumidor es menor de edad, completa los datos del representante.'}),
        {
          status: 400,
          headers: {'Content-Type': 'application/json'},
        },
      );
    }

    const submittedAtDate = new Date();
    const submittedAt = submittedAtDate.toISOString();
    const claimId = await generateClaimId(submittedAtDate);
    const toEmail = getServerEnv('CLAIMS_TO_EMAIL') || siteSettings.email || 'maquinariasluedma@gmail.com';
    const smtpHost = getServerEnv('SMTP_HOST');
    const smtpPort = Number(getServerEnv('SMTP_PORT') || 587);
    const smtpSecure = String(getServerEnv('SMTP_SECURE') || 'false').toLowerCase() === 'true';
    const smtpUser = getServerEnv('SMTP_USER');
    const smtpPassword = getServerEnv('SMTP_PASSWORD');
    const fromEmail = getServerEnv('CLAIMS_FROM_EMAIL') || smtpUser || toEmail;

    const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'].filter((key) => !getServerEnv(key));
    if (missing.length > 0) {
      return new Response(JSON.stringify({error: `Faltan variables SMTP en el entorno: ${missing.join(', ')}.`}), {
        status: 500,
        headers: {'Content-Type': 'application/json'},
      });
    }

    const transporterConfigs = [
      {host: smtpHost, port: smtpPort, secure: smtpSecure},
      smtpPort === 465 ? {host: smtpHost, port: 26, secure: false} : null,
      smtpPort !== 587 ? {host: smtpHost, port: 587, secure: false} : null,
    ].filter((config): config is {host: string; port: number; secure: boolean} => Boolean(config));

    const sendMail = async (mail: {
      from: string;
      to: string;
      replyTo?: string;
      subject: string;
      html: string;
    }) => {
      let lastError: unknown = null;

      for (const config of transporterConfigs) {
        const transporter = nodemailer.createTransport({
          ...config,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });

        try {
          return await transporter.sendMail(mail);
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError instanceof Error ? lastError : new Error('No fue posible conectar con el servidor SMTP.');
    };

    const document = {
      _type: 'claimRecord',
      _id: claimId,
      claimType,
      submittedAt,
      consumerName,
      documentType,
      documentNumber,
      department,
      province,
      district,
      address,
      phone,
      email,
      productService,
      contractedGoodDescription,
      amount,
      purchaseChannel,
      orderNumber,
      detail,
      request: requestDetail,
      isMinor,
      guardianName,
      guardianDocument,
      guardianPhone,
      guardianEmail,
      status: 'recibido',
    };

    if (hasSanityWriteConfig) {
      await sanityAdminClient.create(document);
    }

    const label = claimType === 'queja' ? 'Queja' : 'Reclamo';
    const subject = `Libro de Reclamaciones - ${label} de ${consumerName}`;
    const html = buildEmailHtml(
      {
        claimType,
        submittedAt: formatPeruDate(submittedAt),
        consumerName,
        documentType,
        documentNumber,
        department,
        province,
        district,
        address,
        phone,
        email,
        productService,
        contractedGoodDescription,
        amount,
        purchaseChannel,
        orderNumber,
        detail,
        request: requestDetail,
        isMinor: isMinor ? 'Sí' : 'No',
        guardianName,
        guardianDocument,
        guardianPhone,
        guardianEmail,
      },
      claimId,
    );

    await sendMail({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject,
      html,
    });

    await sendMail({
      from: fromEmail,
      to: email,
      subject: `Copia de tu ${label.toLowerCase()} - Maquinarias Luedma`,
      html,
    });

    return new Response(JSON.stringify({ok: true, id: claimId}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo procesar el reclamo.';
    return new Response(JSON.stringify({error: message}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }
};
