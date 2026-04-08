FROM node:22-alpine
RUN npm install -g tiktak-mcp-server
ENTRYPOINT ["tiktak-mcp-server"]
