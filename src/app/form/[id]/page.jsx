import Oauth2Client from "../../utils/google-auth";
import {cookies} from "next/headers";
import {google} from "googleapis";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Link from "next/link";
import Image from "next/image";


export default async function Page({
  params
}) {
  const formId = (await params).id

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  Oauth2Client.setCredentials({access_token: accessToken});
  let formMetadata
  let formResponses
  const forms = google.forms({version: 'v1', auth: Oauth2Client});
  try {
    const form = await forms.forms.get({
      formId: formId,
    });
    const responses = await forms.forms.responses.list({
      formId: formId,
    });
  
    formMetadata = form.data;
    formResponses = responses.data;
  } catch (error) {
    return (
    <div>
      Something went wrong: {error.message}
    </div>)
  }
  const responseTargets = ['first', 'age', 'height', 'images']
  
  const questions = formMetadata.items.map(item => {
    return {
      id: item.questionItem.question.questionId,
      title: item.title,
    }
  });

  
  const filteredQuestions = questions.filter(question => {
    return responseTargets.some(target => question.title.toLowerCase().includes(target.toLowerCase()))
  });

  
  function extractResponses() {
    return formResponses.responses.map(response => {
      const answers = Object.entries(response.answers).map(([key, value]) => {
        return {
          id: key,
          value: value
        }
      });

      return answers.map(answer => {
        const question = questions.find(question => question.id === answer.value.questionId);
        return {
          question: question?.title,
          answer: answer.value
        }
      }).filter(answer => answer.question);
    });
  }

  const extractedResponses = extractResponses()

  const flattenedResponses = extractedResponses.map(response => {
    return response.map(answer => {
      if( answer.answer.fileUploadAnswers) {
        return {
          question: answer.question,
          answer: answer.answer.fileUploadAnswers.answers.map(file => {
            return {
              fileName: file.fileName,
            }
          })
        }
      }
      return {
        question: answer.question,
        answer: answer.answer.textAnswers.answers[0].value
      }
    })
  })

  function transformLink(link) {
    const fileIdMatch = link.match(/id=([^&]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.usercontent.google.com/download?id=${fileId}`;
    }
    return link;
  }
  

 
  async function fetchImages(fileNames) {
    const drive = google.drive({ version: 'v3', auth: Oauth2Client });
    const imagePromises = fileNames.map(async (fileName) => {
      try {
        const response = await drive.files.list({
          q: `name='${fileName}'`,
          fields: 'files(id, name, webViewLink, webContentLink)',
        });
        const file = response.data.files[0];
        return {
          fileName: file.name,
          webViewLink: file?.webViewLink || '',
          webContentLink: transformLink(file?.webContentLink) || '',
        };
      } catch (error) {
        console.error(`Error fetching image ${fileName}:`, error);
        return null;
      }
    });

    const imagesData = await Promise.all(imagePromises);
    
    const combinedResponses = flattenedResponses.map(response => {
      return response.map(answer => {
        if (Array.isArray(answer.answer)) {
          return {
            question: answer.question,
            answer: answer.answer.map(file => {
              const image = imagesData.find(img => img && img.fileName === file.fileName);
              return {
                ...file,
                webViewLink: image?.webViewLink || '',
                webContentLink: image?.webContentLink || '',
              };
            }),
          };
        }
        return answer;
      });
    });

    console.log(combinedResponses[1][0]);

    return Promise.all(combinedResponses);
  }

  

  const fileNames = flattenedResponses.flatMap(response =>
    response
      .filter(answer => Array.isArray(answer.answer))
      .flatMap(answer => answer.answer.map(file => file.fileName))
  );

  const images = await fetchImages(fileNames);
 
  return (
    <div>
      <h1>{formMetadata.info.title}</h1>
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {images.map((response, index) => (
          <Grid key={index} size={{ xs: 2, sm: 4, md: 4 }}>
            <Card>
              <CardContent>
                {response.map((answer, index) => (
                  <div key={index}>
                    <h3>{answer.question}</h3>
                    {!Array.isArray(answer.answer) && <p>{answer.answer}</p>}
                    {Array.isArray(answer.answer) && (
                      <div>
                        {answer.answer.map((file, index) => (
                          <div key={index}>
                            <img src={file.webContentLink} alt={file.fileName} width={200} height={200} />
                          </div>
                        ))}
                        </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
    </div>
  );
}
