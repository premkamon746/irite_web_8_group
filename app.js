const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const port = 3000;

const dbConfig = {
    host: '103.76.181.219',
    user: 'irite',
    password: 'F5S27Euh',
    database: 'irite'
};

app.use(express.static(path.join(__dirname, 'assets')));

// Parse form data

app.get('/sumary_checkin', async (req, res) => {
    const uid = req.query.uid;
    console.log(uid)
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [incident] = await connection.execute(`
            SELECT i.report_number, i.report_from_where, i.report_officer, i.create_date
            FROM eventreport i     
            WHERE i.uid = ?
        `, [uid]);

        const [evbag] = await connection.execute(`
            SELECT *
            FROM evidentbag 
            WHERE event_report_id = ?
        `, [uid]);

        await connection.end();
        if (incident.length === 0) 
        {
            return res.status(404).send('Incident not found');
        }else if(evbag.length === 0)
        {
            return res.status(404).send('evidentbag not found');
        }

        var evident = []
        const evidentList = evbag.map(row => row.evident).join(',');

        const allValues = evbag.flatMap(row => {
            try {
              const arr = JSON.parse(row.return_pks);

              if (Array.isArray(arr)) {
                return arr;
              } else {
                return [];
              }
            } catch {
              return []; // if JSON.parse fails
            }
          });
          // 2. Remove duplicates (optional)
          const uniqueValues = [...new Set(allValues)];

          // 3. Join with commas
          const return_psk = uniqueValues.join(', ');


        var data = incident[0];
        data["evidentList"] = evidentList;
        data["evg_count"] = evbag.length;
        data["return_psk"] = return_psk;

        let header = await fs.readFile('./views/header.html', 'utf8');
        let table = await fs.readFile('./views/body.html', 'utf8');
        let footer = await fs.readFile('./views/footer.html', 'utf8');

        Object.keys(data).forEach(key => {
            table = table.replace(`{{${key}}}`, data[key] ?? '');
        });

        res.send(header + table + footer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Database error');
    }
});

app.post('/submit-evidence', (req, res) => {
    const {
        report_number,
        location,
        report_officer,
        create_date,
        evidentList,
        evg_count,
        purpose,
        return_psk,
        document_no
    } = req.body;

    const sql = `
        INSERT INTO evidence (
            report_number, location, report_officer, create_date,
            evidentList, evg_count, purpose, return_psk, document_no
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [report_number, location, report_officer, create_date,
         evidentList, evg_count, purpose, return_psk, document_no],
        (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).send('Database error');
            }
            console.log('Data inserted:', result.insertId);
            res.redirect('/thankyou.html'); // Redirect to another page
        }
    );
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});