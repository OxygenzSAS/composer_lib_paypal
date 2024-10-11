# Paypal librairie
Une librairie paypal pour une integration rapide des paiements

## Installation

Via composer
```shell
composer require oxygenzsas/composer_lib_paypal
```

## Exemple d'utilisation

### Controller PHP
```php
<?php 
require __DIR__ . '/vendor/autoload.php';

/** Paypal config et création de classe anonyme pour l'heritage */
$client = new class(
    'xxxxxxxxxxx' /* clientID */
    ,'xxxxxxxxxxxxx' /* SecretID */
    , 'https://api-m.sandbox.paypal.com' /* url API sandox vs prod */
    , 'EUR' /* devise */
    , 'https://sandbox.paypal.com/sdk/js' /* url sdk js */
    ,'http://localhost:8080' /* url de la page unique de paiement */
    , true /* active SSL */
) extends \OxygenzSAS\Paypal\Paypal {
    protected function getAmountFromAttribute(string $attribute) :int
    {
        $data = json_decode($attribute, true);
        /** @todo recuperer ici le montant du paiment a partir des données de attributes */
        return 1234; // return amount
    }
};

/** Database config (PDO) */
\OxygenzSAS\Paypal\Database::setDsn('sqlite:'.__DIR__.'/database.db');
\OxygenzSAS\Paypal\Database::setUsername(null);
\OxygenzSAS\Paypal\Database::setPassword(null);
\OxygenzSAS\Paypal\Database::setOptions([]);

/** init database if necessary */
$client->initDatabase();

/** doi etre appelé sur la page de paiement car il creer les routes sur cette meme page */
$client->initRoute();
```

### Template HTML
```HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paypal test</title>
    <script src="js/script.js"></script> /** @todo utiliser le script js depuis les source composer */
</head>
<body>
<div id="payment_options"></div>

<script type="text/javascript">
    new PaypalCustom( {
        paypal_sdk_url: "<?php echo $client->getUrlJsSdk(); ?>"
        ,client_id: "<?php echo $client->getClientID(); ?>"
        ,currency: "<?php echo $client->getCurrency(); ?>"
        ,attributes: {id_transaction: 45623} /** donnée pour identifier le paiement dans la classe paypal */
        ,url_paiement: "<?php echo $client->getUrlBack(); ?>"
        ,boutonContainerSelector: "#payment_options"
        ,buttonStyle: {
            shape: 'rect'
            ,color: 'gold'
            ,layout: 'vertical'
            ,label: 'paypal'
        }
    });

    document.addEventListener('paypalOrderCreated', (event) => {
        console.log('Order created:', event.detail.order);
    });

    document.addEventListener('paypalOrderCompleted', (event) => {
        console.log(`Thank you for your payment of ${event.detail.amount.value} ${event.detail.amount.currency_code}`);
    });

    document.addEventListener('paypalOrderCancelled', (event) => {
        console.log('Order cancelled!');
    });

    document.addEventListener('paypalError', (event) => {
        console.error('PayPal Error:', event.detail.message);
    });

    document.addEventListener('paypalButtonsInitialized', () => {
        console.log('PayPal buttons have been initialized and are ready for interaction.');
    });

</script>

</body>
</html>
```