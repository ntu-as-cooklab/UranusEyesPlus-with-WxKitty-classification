#!/usr/bin/env sh
#!/usr/bin/python3
if [ $1 = 'auto' ]
then
    cd website
    npm run-script build
    cd ..
    rm -rf server/dist
    mv website/dist/ server/dist/
    cd server
    npm start
fi
if [ $1 = 'run' ]
then
    cd server
    npm start
fi
if [ $1 = 'build' ]
then 
    cd website
    npm run-script build
    cd ..
    rm -rf server/dist
    mv website/dist/ server/dist/
fi
if [ $1 = 'test' ]
then 
    cd server
    npm test
    rm -rf ./data-test
fi
if [ $1 = 'install' ]
then 
  cd ./website && npm install && cd ..
  cd ./server && npm install && cd ..
fi
if [ $1 = 'publish' ]
then 
    cd website
    npm run-script build --aot
    cd ..
    rm -rf server/dist
    mv website/dist/ server/dist/
    cd server
    NODE_ENV=product npm start
fi
