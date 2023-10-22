# İstenenler

- [a. Uygulama oluşturma](#a-uygulama-oluşturma)
- [b. Uygulamanın imajını oluşturma](#b-uygulamanın-imajını-oluşturma)
- [c. Deployment oluşturma ve bununla imajı çalıştırma](#c-deployment-oluşturma-ve-bununla-imajı-çalıştırma)
- [d. ReplicaSet oluşturma ve nasıl çalıştığını inceleme](#d-replicaset-oluşturma-ve-nasıl-çalıştığını-inceleme)
    - [d.1. Deployment ve ReplicaSet farkı](#d1-deployment-ve-replicaset-farkı)
- [e. ClusterIP tipinde Servis oluşturma ve uygulamaya erişme](#e-clusterip-tipinde-servis-oluşturma-ve-uygulamaya-erişme)
    - [e.1. Uygulamaya erişmek (Servis IP ile)](#e1-uygulamaya-erişmek-servis-ip-ile)
    - [e.2. Uygulamaya erişmek (Container IP ile)](#e2-uygulamaya-erişmek-container-ip-ile)

# a. Uygulama oluşturma

Uygulama sadece ekrana `Hello from web-app - VERSIYON_NO!` yazıyor. Burada Deployment ve ReplicaSet farkını incelemek için `VERSION_NO`'yu değiştirerek imajı güncelleyeceğiz. 

# b. Uygulamanın imajını oluşturma

http://localhost:8080 üzerinden `Hello from web-app - 1!` çıktısını veren versiyonu oluşturmak için `index.js` güncellendikten sonra aşağıdaki komut ile imaj oluşturulur.

```bash
docker build -t scnplt/webapp:v2 .
```

`Hello from web-app - 2!` çıktısını veren versiyonu oluşturmak için `index.js` güncellendikten sonra aşağıdaki komut ile imaj oluşturulur.

```bash
docker build -t scnplt/webapp:v2 .
```

Daha sonra bu imajı Docker Hub'a push etmek için aşağıdaki komut kullanılır.

```bash
docker push scnplt/webapp:v1
docker push scnplt/webapp:v2
```

# c. Deployment oluşturma ve bununla imajı çalıştırma

```yaml
apiVersion: apps/v1
kind: Deployment #-----------------> Tipi
metadata:
  name: webapp-deployment #--------> Deployment ismi
spec:
  replicas: 3 #--------------------> Replica sayısı
  selector:
    matchLabels:
      app: webapp1 #---------------> Hangi template'in kullanılacağı
  template:
    metadata:
      labels:
        app: webapp1 #-------------> Deployment ile ilişkilendirilecek template ismi
    spec:
      containers:
      - name: webapp1 #------------> Container ismi
        image: scnplt/webapp:v1 #--> Kullanılacak imaj
        ports:
        - containerPort: 8080 #----> Kullanılacak port
```

Daha sonra oluşturduğumuz [webapp-deployment.yaml](webapp-deployment.yaml) isimli dosyayı aşağıdaki komut ile çalıştırıyoruz.

```bash
kubectl create -f webapp-deployment.yaml
```

# d. ReplicaSet oluşturma ve nasıl çalıştığını inceleme

```yaml
apiVersion: apps/v1
kind: ReplicaSet #-----------------> Tipi
metadata:
  name: webapp-replicaset #--------> ReplicaSet ismi
spec:
  replicas: 3 #--------------------> Replica sayısı
  selector:
    matchLabels:
      app: webapp2 #---------------> Hangi template'in kullanılacağı
  template:
    metadata:
      labels:
        app: webapp2 #-------------> ReplicaSet ile ilişkilendirilecek template ismi
    spec:
      containers:
      - name: webapp2 #------------> Container ismi
        image: scnplt/webapp:v1 #--> Kullanılacak imaj
        ports:
        - containerPort: 8080 #----> Kullanılacak port
```

Daha sonra oluşturduğumuz [webapp-replicaset.yaml](webapp-replicaset.yaml) isimli dosyayı aşağıdaki komut ile çalıştırıyoruz.

```bash
kubectl create -f webapp-replicaset.yaml
```

## d.1. Deployment ve ReplicaSet farkı

Deployment ile oluşturduğumuz podlar Deployment dosyasında değişiklik yaptıktan sonra (örneğin imaj versiyonu güncelleme) `apply` komutu ile kesintisiz olarak güncellenir. Fakat ReplicaSet ile oluşturduğumuz podlar ReplicaSet dosyasında değişiklik yaptıktan sonra güncellenmez. ReplicaSet'in asıl amacı çalışan pod sayısını sabit tutmaktır.

Deployment ile pod oluşturma:
```bash
kubectl create -f webapp-deployment.yaml
```

Podlar:
```bash
NAME                                 READY   STATUS              RESTARTS   AGE
webapp-deployment-65668fffbc-46f24   1/1     Running             0          7s
webapp-deployment-65668fffbc-4q9lx   1/1     Running             0          7s
webapp-deployment-65668fffbc-6b6fx   0/1     Running             0          7s
```

İlk Pod'daki `index.js`:
```bash
kubectl exec webapp-deployment-65668fffbc-46f24 -- sh -c "cat index.js"
```

Çıktısı:
```js
// ...
app.get('/', (_, res) => {
  res.send('Hello from web-app - 1!');
});
// ...
```

Deployment dosyasında imaj versiyonunu güncelledikten sonra `apply` komutu ile güncelleme:

```bash
kubectl apply -f webapp-deployment.yaml
```

Podlar:
```bash
NAME                                 READY   STATUS              RESTARTS   AGE
webapp-deployment-65668fffbc-46f24   1/1     Running             0          99s
webapp-deployment-65668fffbc-4q9lx   1/1     Running             0          99s
webapp-deployment-65668fffbc-6b6fx   1/1     Running             0          99s
webapp-deployment-cc45448b8-8p7cg    0/1     ContainerCreating   0          3s

NAME                                 READY   STATUS              RESTARTS   AGE
webapp-deployment-65668fffbc-46f24   1/1     Running             0          101s
webapp-deployment-65668fffbc-4q9lx   1/1     Running             0          101s
webapp-deployment-65668fffbc-6b6fx   1/1     Terminating         0          101s
webapp-deployment-cc45448b8-8p7cg    1/1     Running             0          5s
webapp-deployment-cc45448b8-qthhh    0/1     ContainerCreating   0          0s

NAME                                 READY   STATUS        RESTARTS   AGE
webapp-deployment-65668fffbc-46f24   1/1     Terminating   0          110s
webapp-deployment-65668fffbc-4q9lx   1/1     Terminating   0          110s
webapp-deployment-65668fffbc-6b6fx   1/1     Terminating   0          110s
webapp-deployment-cc45448b8-52rfz    1/1     Running       0          8s
webapp-deployment-cc45448b8-8p7cg    1/1     Running       0          14s
webapp-deployment-cc45448b8-qthhh    1/1     Running       0          9s

NAME                                READY   STATUS    RESTARTS   AGE
webapp-deployment-cc45448b8-52rfz   1/1     Running   0          33s
webapp-deployment-cc45448b8-8p7cg   1/1     Running   0          39s
webapp-deployment-cc45448b8-qthhh   1/1     Running   0          34s
```

Güncellenen Pod'daki `index.js`:
```bash
kubectl exec webapp-deployment-cc45448b8-52rfz -- sh -c "cat index.js"
```

Çıktısı:
```js
// ...
app.get('/', (_, res) => {
  res.send('Hello from web-app - 2!');
});
// ...
```

# e. ClusterIP tipinde Servis oluşturma ve uygulamaya erişme

```yaml
apiVersion: v1
kind: Service #-----------------> Tipi
metadata:
  name: webapp-service #--------> Servis ismi
spec:
  type: ClusterIP #-------------> Servis tipi
  selector:
    app: webapp1 #--------------> Hangi uygulamaya erişileceği
  ports:
  - protocol: TCP #-------------> Kullanılacak protokol
    port: 80 #------------------> Kullanılacak port
    targetPort: 8080 #----------> Hedef port
```

Daha sonra oluşturduğumuz [webapp-service.yaml](webapp-service.yaml) isimli dosyayı aşağıdaki komut ile çalıştırıyoruz.

```bash
kubectl create -f webapp-service.yaml
```

Kontrol etme:
```bash
kubectl get services
```

Çıktısı:
```bash
NAME             TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kubernetes       ClusterIP   10.96.0.1        <none>        443/TCP   146m
webapp-service   ClusterIP   10.108.101.253   <none>        80/TCP    4s
```

## e.1. Uygulamaya erişmek (Servis IP ile)

```bash
# ReplicaSet ile oluşturulan podlardan birine erişmek için
# Daha önce oluşturulan webapp-replicaset-dg4cp kullanılıyor.
kubectl exec webapp-replicaset-dg4cp -ti -- bash

# Container içinde webapp-service servisine istek atmak için
apt update && apt install curl -y
curl http://10.108.101.253
```

Çıktısı:
```bash
Hello from web-app - 1!
```

## e.2. Uygulamaya erişmek (Container IP ile)

```bash
# Daha önce oluşturulan webapp-replicaset-dg4cp kullanılıyor.
kubectl exec webapp-replicaset-dg4cp -ti -- bash

# Container içinde webapp-deployment-cc45448b8-52rfz (IP: 10.244.0.125) poduna istek atmak için.
apt update && apt install curl -y
curl 10.244.0.125:8080
```

Çıktısı:
```bash
Hello from web-app - 1!
```
