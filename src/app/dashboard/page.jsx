import Oauth2Client from "../utils/google-auth";
import {cookies} from "next/headers";
import {google} from "googleapis";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Link from "next/link";

import styles from "./page.module.css";

export default async function Page() {

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  Oauth2Client.setCredentials({access_token: accessToken});
  let files
  const drive = google.drive({version: 'v3', auth: Oauth2Client});
  const mimeType = 'application/vnd.google-apps.form';
  try {
    const result = await drive.files.list({
      q: `mimeType='${mimeType}'`,
      pageSize: 1000,
      fields: 'nextPageToken, files(id, name)',
    });
    files = result.data.files;
  } catch (error) {
    return (
    <div>
      Something went wrong: {error.message}
    </div>)
  }
 
  return (
    <div className={styles.dashboard}>
      <h1>Casting Forms</h1>
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {files?.map(file => (
          <Grid key={file.id} size={{ xs: 2, sm: 4, md: 4 }}>
            <Link href={`/form/${file.id}`}>
              <Card>
                <CardContent>
                  {file.name}
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
