import styles from "./page.module.css";
import Button from '@mui/material/Button';
import Oauth2Client from "./utils/google-auth";
import Link from "next/link";

export default function Home() {
const SCOPE = ['https://www.googleapis.com/auth/forms.responses.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/forms.body.readonly'];
const URL = Oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPE
});

  return (
    <div className={styles.page}>
      <Link href={URL}>
        <Button variant="contained">Login</Button>
      </Link>
    </div>
  );
}
