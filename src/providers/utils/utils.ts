import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { LoadingController, Loading, ActionSheetController, AlertController, Platform } from 'ionic-angular';
import { ImagePicker, ImagePickerOptions } from '@ionic-native/image-picker';
import { CameraOptions, Camera } from '@ionic-native/camera';
import 'rxjs/add/operator/map';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage';

export class User 
{
  constructor()
  {
  }
}


@Injectable()
export class UtilsProvider {

  public appName: string = 'BaseApp';
  currentUser: User;
  private secureStorage:SecureStorage;
  
  constructor(
    public http: Http,
    private loadingCtrl: LoadingController,
    private actionSheetCtrl: ActionSheetController,
    private imagePicker: ImagePicker,
    private camera: Camera,
    private alertCtrl: AlertController,
    private platform: Platform
  ) 
  {
    this.secureStorage = new SecureStorage();
  }

  public login(credentials: { email: string, password: string }, url: string) : Promise<boolean>
  {
    return new Promise<boolean>((resolve, reject) => 
    {
      if (credentials.email === "" || credentials.password === "") 
        reject(false);
      else 
      {
        this.post(url, JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })).then((success) => {
          if (success)
          {
            this.showAlert('Login efetuado com sucesso', 'Sucesso');
            this.currentUser = new User();
            this.platform.ready().then(() => 
            {
              this.secureStorage.create(this.appName)
              .then((storage: SecureStorageObject) => 
              {
                storage.set('User', JSON.stringify(this.currentUser))
                  .then(
                    data => console.log(data),
                    error => console.log(error)
                );
              });
            });
          }
          else
          {
            this.showAlert('Credenciais incorretas', 'Erro');
          }
        });
      }
    });
  }

  public setField(name: string, value: any): Promise<boolean>
  {
    return new Promise<boolean>((resolve, reject) => 
    {
        this.platform.ready().then(() => 
        {
          this.secureStorage.create(this.appName)
            .then((storage: SecureStorageObject) => 
            {
              storage.set(name, JSON.stringify(value))
                .then(
                  data => 
                  {
                    console.log(JSON.stringify(data));
                    resolve(true);
                  },
                  error => 
                  {
                    console.log(JSON.stringify(error));
                    reject(false);
                  }
              );
            });
        });
    });
  }

  public removeField(name: string): Promise<boolean>
  {
    return new Promise<boolean>((resolve, reject) => 
    {
      this.platform.ready().then(() => 
      {
        this.secureStorage.create(this.appName)
          .then((storage: SecureStorageObject) => 
          {
            storage.remove(name)
              .then(
                data => 
                {
                  console.log(JSON.stringify(data));
                  resolve(true);
                },
                error => 
                {
                  console.log(JSON.stringify(error));
                  reject(false);
                }
            );
          });
      });
    });
  }

 public getField(name: string): Promise<string>
 {
    return new Promise<string>((resolve, reject) => 
    {
      this.platform.ready().then(() => 
      {
        this.secureStorage.create(this.appName)
          .then((storage: SecureStorageObject) => 
          {
            storage.get(name)
              .then(
                data => 
                {
                  resolve(data);
                },
                error => 
                {
                  reject(null);
                }
            );
          });
      });
    });
 }
 
  public register(credentials: any, url: string) 
  {
    return new Promise<boolean>((resolve, reject) => 
    {
      if (credentials.email === "" || credentials.password === "") 
        reject(false);
      else 
      {
        this.post(url, credentials).then((success) => 
        {
          if (success)
          {
            this.showAlert('Cadastro efetuado com sucesso', 'Sucesso');
          }
          else
          {
            this.showAlert('Erro ao realizar o cadastro', 'Erro');
          }
          resolve(success);
        })
        .catch(err => console.log(JSON.stringify(err)));
      }
    });
  }
 
  public getUser(): Promise<User>
  {
    return new Promise<User>((resolve, reject) => 
    {
      if (this.currentUser !== undefined)
        resolve(this.currentUser);

      this.getField('User').then((user) => 
      {
        let json = JSON.parse(user);
        this.currentUser = new User();
        resolve(this.currentUser);
      })
      .catch((err) => 
      {
        reject(null);
      })
    });
  }
 
  public logout(): Promise<boolean>
  {
    return new Promise<boolean>((resolve, reject) => 
    {
      this.removeField('User').then((success) => console.log(success)).catch((err) => console.log(err));
    });
  }

  public showLoading() : Loading
  {
    let loading = this.loadingCtrl.create({
      content: 'Por favor, aguarde...',
      dismissOnPageChange: true
    });
    loading.present();
    return loading;
  }
  
  public post(url: string, param: string) : Promise<boolean>
  {
    return new Promise<boolean>((resolve, reject) => {
      let loading = this.showLoading();
      this.http.post(url, param)
      .map(res => res.json())
      .subscribe(
        data => {
          loading.dismiss();
          console.log(JSON.stringify(data));
          resolve(data['status']);
        },
        error => {
          loading.dismiss();
          console.log(JSON.stringify(error));
          reject(false);
        }
      );
    });
  }

  public showAlert(msg: string, title: string)
  {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: msg,
      buttons: ['OK']
    });
    alert.present();
  }

  public get(url: string, param: string): Promise<boolean>
  {
    return new Promise<boolean>((resolve, reject) => {
      let loading = this.showLoading();
      this.http.get("url" + param)
        .map(res => res.json())
        .subscribe(
        data => {
          loading.dismiss();
          console.log(JSON.stringify(data));
          resolve(data['status']);
        },
        error => {
          loading.dismiss();
          console.log(JSON.stringify(error));
          reject(false);
        });
    });
  }

  public chooseFrom() : Promise<string>
  {
    return new Promise<string>((resolve, reject) => {
      let actionSheet = this.actionSheetCtrl.create({
        title: 'Qual é a origem da foto?',
        buttons: [
          {
            text: 'Usar Galeria',
            handler: () => {
              this.getPicture().then((base64) => resolve(base64)).catch((base64) => reject(null));
            }
          },
          {
            text: 'Usar Camera',
            handler: () => {
              this.takePicture().then((base64) => resolve(base64)).catch((base64) => reject(null));
            }
          },
          {
            text: 'Cancelar',
            role: 'cancel'
          }
        ]
      });
      actionSheet.present();
    })
  }

  private getPicture() : Promise<string>
  {
    return new Promise<string>((resolve, reject) => {
      const options: ImagePickerOptions = {
        quality: 30,
        outputType: 1,
        maximumImagesCount: 1
      }
  
      this.imagePicker.getPictures(options).then((results) => {
        let base64Image = 'data:image/png;base64,' + results[0];
        resolve(base64Image);
      }, (err) => {
        let alert = this.alertCtrl.create({
          title: 'Erro',
          subTitle: 'Erro ao tentar selecionar uma foto',
          buttons: ['OK']
        });
        alert.present();
        reject(null);
       });
    });
  }

  private takePicture() : Promise<string>
  {
    return new Promise<string>((resolve, reject) => {
      const options: CameraOptions = {
        quality: 30,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.PNG,
        mediaType: this.camera.MediaType.PICTURE
      }
  
      this.camera.getPicture(options).then((imageData) => {
        let base64Image = 'data:image/png;base64,' + imageData;
        resolve(base64Image);
       }, (err) => {
        let alert = this.alertCtrl.create({
          title: 'Erro',
          subTitle: 'Erro ao tentar tirar uma foto',
          buttons: ['OK']
        });
        alert.present();
        reject(null);
       });
    });
  }

}
