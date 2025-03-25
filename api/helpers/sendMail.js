import ejs from 'ejs'
import fs from 'fs'
import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const readTemplate = (template) => {
  const templatePath = path.join(__dirname, '../templates', template)
  return fs.readFileSync(templatePath).toString()
}

const renderTemplate = (template, metaData) => {
  return ejs.render(template, metaData)
}

const prepateTemplate = (template, metaData) => {
  const baseTemplate = readTemplate('base.ejs')

  const baseHTML = renderTemplate(baseTemplate, metaData)

  const templateData = readTemplate(template)

  const templateHTML = renderTemplate(templateData, metaData)

  const finalHTML = baseHTML.replace('REPLACE_WITH_TEMPLATE', templateHTML)

  return finalHTML
}

const sendMail = (to, template = '', metaData = {}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })

  const mailOptions = {
    to,
    subject: metaData.subject,
    html: prepateTemplate(template, metaData),
  }

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.log(err)
    } else {
    }
  })
}

export default sendMail
global.sendMail = sendMail
