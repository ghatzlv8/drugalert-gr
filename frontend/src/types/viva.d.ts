declare global {
  interface Window {
    VivaPayments: {
      forms: {
        setup: (config: {
          authToken: string;
          baseURL: string;
          cardTokenHandler: (response: { chargeToken: string }) => void;
          installments?: number;
          paymentMethod?: string;
          customerEmail?: string;
          styles?: any;
        }) => {
          create: (type: 'cardNumber' | 'cardExpiry' | 'cardCvc') => {
            mount: (selector: string) => void;
          };
          createToken: (callback: (result: { error?: any }) => void) => void;
        };
      };
    };
  }
}

export {};
