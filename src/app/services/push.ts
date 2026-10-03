import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { SwPush } from '@angular/service-worker';

import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PushService {

    private apiUrl = '/api';

    constructor(private http: HttpClient, private swPush: SwPush, private router: Router) {
        this.listenForNotificationClicks();

    }


    getToken() {
        return sessionStorage.getItem('token');
    }

    // GET PUBLIC KEY
    getPublicKey(): Observable<{
        success: boolean;
        publicKey: string;
    }> {
        return this.http.get<{
            success: boolean;
            publicKey: string;
        }>(
            `${environment.apiProdUrl}/pushSubs`,
            {
                headers: {
                    Authorization: `Bearer ${this.getToken()}`
                }
            }
        );
    }


    // SAVE SUBSCRIPTION
    saveSubscription(
        subscription: PushSubscription
    ) {

        // return this.http.post<any>(
        //     `${this.apiUrl}/push/subscribe`,
        //     subscription.toJSON()
        // );
        return this.http.post(
            `${environment.apiProdUrl}/pushSubs`, subscription.toJSON(),
            {
                headers: {
                    Authorization: `Bearer ${this.getToken()}`
                }
            }
        );

    }


    // ENABLE BROWSER PUSH
    async enablePush(): Promise<void> {

        if (!this.swPush.isEnabled) {

            console.log(
                'Service Worker is not enabled'
            );

            return;

        }
        try {

            const response = await this.getPublicKey().toPromise();


            const publicKey = response?.publicKey;


             if (!publicKey) {

    console.error(
        'VAPID public key is missing'
    );

    return;
}

const subscription =
    await this.swPush.requestSubscription({

        serverPublicKey: publicKey

    });


            console.log(
                'Browser push subscription:',
                subscription
            );


            this.saveSubscription(
                subscription
            ).subscribe({

                next: (response) => {

                    console.log(
                        'Subscription saved:',
                        response
                    );

                },

                error: (error) => {

                    console.error(
                        'Subscription save error:',
                        error
                    );

                }

            });


        } catch (error) {

            console.error(
                'Push permission error:',
                error
            );

        }

    }


    // NOTIFICATION CLICK
    private listenForNotificationClicks() {

        if (!this.swPush.isEnabled) {
            return;
        }


        this.swPush.notificationClicks
            .subscribe(
                ({
                    notification
                }) => {

                    console.log(
                        'Notification clicked:',
                        notification
                    );


                    const data: any =
                        notification.data;


                    if (data?.url) {

                        this.router.navigateByUrl(
                            data.url
                        );

                    } else {

                        this.router.navigate([
                            '/login'
                        ]);

                    }

                }
            );

    }

}