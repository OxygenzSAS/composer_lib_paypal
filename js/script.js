class PaypalCustom {
    constructor({ paypal_sdk_url, client_id, currency, attributes, url_paiement, buttonStyle, boutonContainerSelector }) {
        this.paypal_sdk_url = paypal_sdk_url;
        this.client_id = client_id;
        this.currency = currency;
        this.attributes = attributes;
        this.url_paiement = url_paiement;
        this.buttonStyle = buttonStyle; // Ajouter le style des boutons en tant que paramètre
        this.boutonContainerSelector = boutonContainerSelector; // Ajouter le sélecteur dynamique
        this.init();
    }

    init = function () {
        let instance = this;
        // Charger le SDK PayPal
        instance.url_to_head(instance.paypal_sdk_url)
            .then(() => {
                instance.afterInitSDK();
            })
            .catch((error) => {
                instance.triggerEvent('paypalError', { message: error });
            });
    }

    async afterInitSDK() {
        let instance = this;

        try {
            const clientToken = await getBrowserSafeClientToken();

            const sdkInstance = await window.paypal.createInstance({
                clientToken,
                components: ["paypal-payments"],
                pageType: "checkout",
            });
            console.log("PayPal SDK initialized successfully");

            setupPayPalButton(sdkInstance);

        } catch (error) {
            console.error(error);
        }

        async function setupPayPalButton(sdkInstance) {


            const paymentSessionOptions = {
                async onApprove(data) {
                    console.log("onApprove", data);
                    const orderData = await captureOrder({
                        orderId: data.orderId,
                    });
                    renderAlert({
                        type: "success",
                        message: `Order successfully captured! ${JSON.stringify(data)}`,
                    });
                    console.log("Capture result", orderData);
                },
                onCancel(data) {
                    renderAlert({ type: "warning", message: "onCancel() callback called" });
                    console.log("onCancel", data);
                },
                onError(error) {
                    renderAlert({
                        type: "danger",
                        message: `onError() callback called: ${error}`,
                    });
                    console.log("onError", error);
                },
            };

            const paypalPaymentSession = sdkInstance.createPayPalOneTimePaymentSession(
                paymentSessionOptions,
            );

            const paypalButton = document.querySelector("#paypal-button");
            paypalButton.removeAttribute("hidden");

            paypalButton.addEventListener("click", async () => {
                try {
                    // get the promise reference by invoking createOrder()
                    // do not await this async function since it can cause transient activation issues
                    const createOrderPromise = createOrder();
                    await paypalPaymentSession.start(
                        { presentationMode: "modal" },
                        createOrderPromise,
                    );
                } catch (error) {
                    console.error(error);
                }
            });
        }

        async function getBrowserSafeClientToken() {
            const response = await fetch(instance.url_paiement, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({action: 'get_token'}).toString()
            });
            const { accessToken } = await response.json();

            return accessToken;
        }

        async function createOrder() {
            const response = await fetch(instance.url_paiement, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({action: 'create_order', attributes: JSON.stringify(instance.attributes) }).toString()
            });

            const { id } = await response.json();
            renderAlert({ type: "info", message: `Order successfully created: ${id}` });

            return { orderId: id };
        }

        async function captureOrder({ orderId }) {
            const response = await fetch(instance.url_paiement, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({action: 'complete_order', order_id: orderId }).toString()
            });
            const data = await response.json();

            return data;
        }

        function renderAlert({ type, message }) {
            const alertContainer = document.querySelector(".alert-container");
            if (!alertContainer) {
                return;
            }

            // remove existing alert
            const existingAlertComponent =
                alertContainer.querySelector("alert-component");
            existingAlertComponent?.remove();

            const alertComponent = document.createElement("alert-component");
            alertComponent.setAttribute("type", type);

            const alertMessageSlot = document.createElement("span");
            alertMessageSlot.setAttribute("slot", "alert-message");
            alertMessageSlot.innerText = message;

            alertComponent.append(alertMessageSlot);
            alertContainer.append(alertComponent);
        }

        // Déclenchement de l'événement après l'initialisation des boutons
        instance.triggerEvent('paypalButtonsInitialized');
    }

    // Méthode pour déclencher des événements personnalisés
    triggerEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    url_to_head = (url) => {
        return new Promise(function (resolve, reject) {
            let script = document.createElement('script');
            script.src = url;
            script.onload = function () {
                resolve();
            };
            script.onerror = function () {
                reject('Error loading script.');
            };
            document.head.appendChild(script);
        });
    }

}
