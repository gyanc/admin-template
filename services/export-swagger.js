const http = require('http');
const fs = require('fs');
const path = require('path');

// Wait for server to be fully up
setTimeout(() => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/docs-json',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const swagger = JSON.parse(data);
        
        // Save Swagger JSON
        const swaggerPath = path.join(__dirname, 'swagger.json');
        fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
        console.log('✅ Swagger JSON saved to swagger.json');

        // Convert to Postman Collection v2.1
        const postmanCollection = convertToPostman(swagger);
        const postmanPath = path.join(__dirname, 'admin-panel-api.postman_collection.json');
        fs.writeFileSync(postmanPath, JSON.stringify(postmanCollection, null, 2));
        console.log('✅ Postman collection saved to admin-panel-api.postman_collection.json');

        process.exit(0);
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error fetching Swagger JSON:', error.message);
    console.log('Make sure the server is running on http://localhost:3000');
    process.exit(1);
  });

  req.end();
}, 3000);

function convertToPostman(swagger) {
  const collection = {
    info: {
      name: swagger.info.title,
      description: swagger.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: swagger.info.version,
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string',
        },
      ],
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'string',
      },
      {
        key: 'jwt_token',
        value: '',
        type: 'string',
      },
    ],
    item: [],
  };

  // Group endpoints by tags
  const folders = {};

  for (const [path, methods] of Object.entries(swagger.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const tag = details.tags?.[0] || 'Other';
      
      if (!folders[tag]) {
        folders[tag] = {
          name: tag,
          item: [],
        };
      }

      const request = {
        name: details.summary || `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          url: {
            raw: '{{baseUrl}}' + path,
            host: ['{{baseUrl}}'],
            path: path.split('/').filter(p => p),
          },
        },
        response: [],
      };

      // Add auth for protected endpoints
      if (details.security) {
        request.request.auth = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{jwt_token}}',
              type: 'string',
            },
          ],
        };
      }

      // Add request body if present
      if (details.requestBody?.content?.['application/json']?.schema) {
        const schema = details.requestBody.content['application/json'].schema;
        request.request.body = {
          mode: 'raw',
          raw: JSON.stringify(generateExampleFromSchema(schema), null, 2),
          options: {
            raw: {
              language: 'json',
            },
          },
        };
      }

      // Add query parameters
      if (details.parameters) {
        const queryParams = details.parameters.filter(p => p.in === 'query');
        if (queryParams.length > 0) {
          request.request.url.query = queryParams.map(p => ({
            key: p.name,
            value: p.example || '',
            description: p.description || '',
          }));
        }
      }

      folders[tag].item.push(request);
    }
  }

  collection.item = Object.values(folders);
  return collection;
}

function generateExampleFromSchema(schema) {
  if (schema.example) return schema.example;
  
  const example = {};
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (prop.example !== undefined) {
        example[key] = prop.example;
      } else if (prop.type === 'string') {
        example[key] = `example_${key}`;
      } else if (prop.type === 'number' || prop.type === 'integer') {
        example[key] = 0;
      } else if (prop.type === 'boolean') {
        example[key] = false;
      } else if (prop.type === 'array') {
        example[key] = [];
      } else if (prop.type === 'object') {
        example[key] = {};
      }
    }
  }
  return example;
}
