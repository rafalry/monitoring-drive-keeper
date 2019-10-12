const {google} = require('googleapis')
const dateFormat = require('dateformat')
const datedFolderNameRegex = new RegExp(`.*-2\\d{7}$`)
const todaySuffix = dateFormat(new Date(), '-yyyymmdd')

const CLIENT_ID = process.env.MDK_CLIENT_ID
const CLIENT_SECRET = process.env.MDK_CLIENT_SECRET 
const REFRESH_TOKEN = process.env.MDK_REFRESH_TOKEN
const REDIRECT_URL = process.env.MDK_REDIRECT_URL

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
)
oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN
})

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
})

async function listRootFolders() {
  const res = await drive.files.list({
    pageSize: 100,
    fields: 'files(id, name)',
    q: "'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false"
  })
  console.log('Fetched folders:', res.data.files.map((file) => file.name).join(', '))
  return res.data.files
}

async function renameFolderOnDrive(id, newName) {
  const res = await drive.files.update({
    fileId: id,
    // requestBody: {
    //   name: newName
    // }
  })
  return res.data
}

async function renameRootFolders() {
  const folders = await listRootFolders()
  folders.forEach(async (folder) => {
    if (!folder.name.match(datedFolderNameRegex)) {
      const newName = folder.name + todaySuffix
      if (folders.map((folder) => folder.name).indexOf(newName) === -1) {
        console.log(`Processing folder ${folder.name} with id ${folder.id}, try rename to ${newName}`)
        const renamedFolder = await renameFolderOnDrive(folder.id, newName)
        console.debug(`Renamed ${folder.name} to ${renamedFolder.name}`)
      } else {
        console.debug(`Skipping folder ${folder.name} with id ${folder.id}, folder with name ${newName} already exists`)
      }
    } else {
      console.debug(`Skipping folder ${folder.name} with id ${folder.id}`)
    }
  })
}

function execute() {
  renameRootFolders()
}

module.exports = {
  execute
}